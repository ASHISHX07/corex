#include <iostream>
#include <iomanip>
#include <mutex>
#include <thread>
#include <chrono>
#include <atomic>
#include <condition_variable>
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
    std::cout << "\n[INDEX #" << slot << "]"
              << "\n instrument         : " << std::fixed << idx.symbol
              << "\n ltp                : " << std::fixed << idx.ltp
              << "\n open               : " << std::fixed << idx.open
              << "\n high               : " << std::fixed << idx.high
              << "\n low                : " << std::fixed << idx.low
              << "\n close              : " << std::fixed << idx.prevClose
              << "\n ch                 : " << std::fixed << idx.ch
              << "\n chp                : " << std::fixed << idx.chp
              << "\n fp                 : " << std::fixed << idx.fp
              << "\n fpch               : " << std::fixed << idx.fpch
              << "\n fpchp              : " << std::fixed << idx.fpchp
              << "\n tCallOi            : " << std::fixed << idx.tCallOi
              << "\n tPutOi             : " << std::fixed << idx.tPutOi
              << "\n iVix               : " << std::fixed << idx.iVixLtp
              << "\n iVixCh             : " << std::fixed << idx.iVixCh
              << "\n iVixChp            : " << std::fixed << idx.iVixChp
              << "\n exchFeedTime       : " << std::fixed << idx.exchFeedTime
              << "\n signal             : " << std::fixed << idx.signal
              << std::endl;
}

void printOptions(int slot, const OptionsHeader& opt) {
    std::lock_guard<std::mutex> lock(g_consoleMutex);
    std::cout << "\n[OPTION #" << slot << "]"
              << "\n instrument         : " << std::fixed << opt.symbol
              << "\n cp                 : " << std::fixed << opt.cp
              << "\n strike             : " << std::fixed << opt.strike
              << "\n ltp                : " << std::fixed << opt.ltp
              << "\n ch                 : " << std::fixed << opt.ch
              << "\n chp                : " << std::fixed << opt.chp
              << "\n volume             : " << std::fixed << opt.volume
              << "\n oi                 : " << std::fixed << opt.oi
              << "\n chngInOi           : " << std::fixed << opt.chngInOi
              << "\n prevOi             : " << std::fixed << opt.prevOi
              << "\n totBuyQty          : " << std::fixed << opt.totBuyQty
              << "\n totSellQty         : " << std::fixed << opt.totSellQty
              << "\n avgTradePrice      : " << std::fixed << opt.avgTradePrice
              << "\n high               : " << std::fixed << opt.high
              << "\n low                : " << std::fixed << opt.low
              << "\n open               : " << std::fixed << opt.open
              << "\n close              : " << std::fixed << opt.prevClose
              << "\n upperCkt           : " << std::fixed << opt.upperCkt
              << "\n lowerCkt           : " << std::fixed << opt.lowerCkt
              << "\n iv                 : " << std::fixed << opt.iv
              << "\n delta              : " << std::fixed << opt.delta
              << "\n theta              : " << std::fixed << opt.theta
              << "\n gamma              : " << std::fixed << opt.gamma
              << "\n vega               : " << std::fixed << opt.vega
              << "\n exchFeedTime       : " << std::fixed << opt.exchFeedTime
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