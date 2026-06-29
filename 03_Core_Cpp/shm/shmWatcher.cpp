#include <iostream>
#include <iomanip>
#include <mutex>
#include <thread>
#include <chrono>
#include <atomic>
#include <condition_variable>
#include <cstdint>
#include "shmWatcher.hpp"
#include "shm-buffer.hpp"

std::atomic<bool> running { true };
static std::mutex g_consoleMutex;
static std::mutex g_shutDownCvMtx{};
static std::condition_variable g_shutDownCv{};
static volatile sig_atomic_t g_signalReceived { 0 };

void onSignal(int) {
    g_signalReceived = 1;
    running = false;
    g_shutDownCv.notify_all();
}

void PrintIndex(int slot, const IndicsHeader& idx) {
    std::lock_guard<std::mutex> lock(g_consoleMutex);
    std::cout << "\n[INDEX #" << slot + 1 << "]"
              << "\n instrument         : " << std::fixed << idx.symbol
              << "\n ltp                : " << std::fixed << std::setprecision(2) << idx.ltp
              << "\n open               : " << std::fixed << std::setprecision(2) << idx.open
              << "\n high               : " << std::fixed << std::setprecision(2) << idx.high
              << "\n low                : " << std::fixed << std::setprecision(2) << idx.low
              << "\n close              : " << std::fixed << std::setprecision(2) << idx.prevClose
              << "\n ch                 : " << std::fixed << std::setprecision(2) << idx.ch
              << "\n chp                : " << std::fixed << std::setprecision(2) << idx.chp
              << "\n fp                 : " << std::fixed << std::setprecision(2) << idx.fp
              << "\n fpch               : " << std::fixed << std::setprecision(2) << idx.fpch
              << "\n fpchp              : " << std::fixed << std::setprecision(2) << idx.fpchp
              << "\n tCallOi            : " << std::fixed << idx.tCallOi
              << "\n tPutOi             : " << std::fixed << idx.tPutOi
              << "\n iVix               : " << std::fixed << std::setprecision(2) << idx.iVixLtp
              << "\n iVixCh             : " << std::fixed << std::setprecision(2) << idx.iVixCh
              << "\n iVixChp            : " << std::fixed << std::setprecision(2) << idx.iVixChp
              << "\n exchFeedTime       : " << std::fixed << idx.exchFeedTime
              << "\n signal             : " << std::fixed << idx.signal
              << std::endl;
}

void printOptions(int slot, const OptionsHeader& opt) {
    std::lock_guard<std::mutex> lock(g_consoleMutex);
    std::cout << "\n[OPTION #" << slot + 1 << "]"
              << "\n instrument         : " << std::fixed << opt.symbol
              << "\n cp                 : " << std::fixed << opt.cp
              << "\n strike             : " << std::fixed << std::setprecision(2) << opt.strike
              << "\n ltp                : " << std::fixed << std::setprecision(2) << opt.ltp
              << "\n ch                 : " << std::fixed << std::setprecision(2) << opt.ch
              << "\n chp                : " << std::fixed << std::setprecision(2) << opt.chp
              << "\n volume             : " << std::fixed << opt.volume
              << "\n oi                 : " << std::fixed << opt.oi
              << "\n chngInOi           : " << std::fixed << opt.chngInOi
              << "\n prevOi             : " << std::fixed << opt.prevOi
              << "\n totBuyQty          : " << std::fixed << opt.totBuyQty
              << "\n totSellQty         : " << std::fixed << opt.totSellQty
              << "\n avgTradePrice      : " << std::fixed << std::setprecision(2) << opt.avgTradePrice
              << "\n high               : " << std::fixed << std::setprecision(2) << opt.high
              << "\n low                : " << std::fixed << std::setprecision(2) << opt.low
              << "\n open               : " << std::fixed << std::setprecision(2) << opt.open
              << "\n close              : " << std::fixed << std::setprecision(2) << opt.prevClose
              << "\n upperCkt           : " << std::fixed << std::setprecision(2) << opt.upperCkt
              << "\n lowerCkt           : " << std::fixed << std::setprecision(2) << opt.lowerCkt
              << "\n iv                 : " << std::fixed << std::setprecision(3) << opt.iv
              << "\n delta              : " << std::fixed << std::setprecision(3) << opt.delta
              << "\n theta              : " << std::fixed << std::setprecision(3) << opt.theta
              << "\n gamma              : " << std::fixed << std::setprecision(3) << opt.gamma
              << "\n vega               : " << std::fixed << std::setprecision(3) << opt.vega
              << "\n lastTradedQty      : " << std::fixed << opt.lastTradedQty
              << "\n exchFeedTime       : " << std::fixed << opt.exchFeedTime
              << "\n lastTradedAt       : " << std::fixed << opt.lastTradedAt
              << "\n signal             : " << std::fixed << opt.signal
              << std::endl;
} 

void printController(const ControllerHeader& ctrl) {
    std::lock_guard<std::mutex> lock(g_consoleMutex);
    std::cout << "[CONTROLLER]"
              << "  system status: " << ctrl.systemStatus
              << "  indices      : " << ctrl.IndicesCount
              << "  options      : " << ctrl.OptionsCount
              << "  signal       : " << ctrl.signal
              << std::endl;
}

void watchController(const ShmMem& mem) {
    bool wasReady { false };

    while (g_signalReceived) {
        std::cout << "\n[CORE] Shutting Down..." << std::endl;
        const volatile int status = mem.ctrl->systemStatus;
        printController(*mem.ctrl);
        if (status == 1) wasReady = true;     // Node is up and running
        // If Node sets systemStatus = 0 → it's shutting down, follow it
        if (wasReady && status == 0) {
            running = false;
            return;
        }
        std::unique_lock lk(g_shutDownCvMtx);
        g_shutDownCv.wait_for(lk, std::chrono::seconds(1), []{ return !running.load(); });
        if (!running) return;
    }
}

void watchIndex(const ShmMem& mem) {
    while (running) {
        for (int i = 0; i < mem.n_indices; i++) {
            PrintIndex(i, mem.indices[i]);
        }
        std::unique_lock lk(g_shutDownCvMtx);
        g_shutDownCv.wait_for(lk, std::chrono::seconds(1), []{ return !running.load(); });
        if (!running) return;
    }
}

void watchOptions(const ShmMem& mem) {
    while (running) {
        for (int i = 0; i < mem.n_options; i++) {
            if (mem.options[i].symbol[0] == '\0') continue;
            printOptions(i, mem.options[i]);
        }
        std::unique_lock lk(g_shutDownCvMtx);
        g_shutDownCv.wait_for(lk, std::chrono::seconds(1), []{ return !running.load(); });
        if (!running) return;
    }
}