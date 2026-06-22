#include <iostream>
#include <iomanip>
#include <mutex>
#include <thread>
#include <chrono>
#include <atomic>
#include "shmWatcher.hpp"
#include "shm-buffer.hpp"

std::atomic<bool> running { true };
static std::mutex g_consoleMutex;

void onSignal(int) {
    std::cout << "\n[CORE] Shutting down..." << std::endl;
    running = false;
}

void PrintIndex(int slot, const IndicsHeader& idx) {
    std::lock_guard<std::mutex> lock(g_consoleMutex);
    std::cout << "\n[INDEX #" << slot << "]"
              << "\n instrument         : " << std::fixed << std::setprecision(0) << idx.symbol
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
              << "\n iVix               : " << std::fixed << std::setprecision(2) << idx.iVixLtp
              << "\n iVixCh             : " << std::fixed << std::setprecision(2) << idx.iVixCh
              << "\n iVixChp            : " << std::fixed << std::setprecision(2) << idx.iVixChp
              << "\n exchFeedTime       : " << std::fixed << std::setprecision(0) << idx.exchFeedTime
              << "\n signal             : " << std::fixed << std::setprecision(0) << idx.signal
              << std::endl;
}

void printOptions(int slot, const OptionsHeader& opt) {
    std::lock_guard<std::mutex> lock(g_consoleMutex);
    std::cout << "\n[OPTION #" << slot << "]"
              << "\n instrument         : " << std::fixed << std::setprecision(0) << opt.symbol
              << "\n cp                 : " << std::fixed << std::setprecision(2) << opt.cp
              << "\n ltp                : " << std::fixed << std::setprecision(2) << opt.ltp
              << "\n ch                 : " << std::fixed << std::setprecision(2) << opt.ch
              << "\n chp                : " << std::fixed << std::setprecision(2) << opt.chp
              << "\n volume             : " << std::fixed << std::setprecision(2) << opt.volume
              << "\n oi                 : " << std::fixed << std::setprecision(0) << opt.oi
              << "\n chngInOi           : " << std::fixed << std::setprecision(0) << opt.chngInOi
              << "\n prevOi             : " << std::fixed << std::setprecision(0) << opt.prevOi
              << "\n totBuyQty          : " << std::fixed << std::setprecision(2) << opt.totBuyQty
              << "\n totSellQty         : " << std::fixed << std::setprecision(2) << opt.totSellQty
              << "\n avgTradePrice      : " << std::fixed << std::setprecision(2) << opt.avgTradePrice
              << "\n high               : " << std::fixed << std::setprecision(2) << opt.high
              << "\n low                : " << std::fixed << std::setprecision(2) << opt.low
              << "\n open               : " << std::fixed << std::setprecision(2) << opt.open
              << "\n close              : " << std::fixed << std::setprecision(2) << opt.prevClose
              << "\n upperCkt           : " << std::fixed << std::setprecision(2) << opt.upperCkt
              << "\n lowerCkt           : " << std::fixed << std::setprecision(2) << opt.lowerCkt
              << "\n iv                 : " << std::fixed << std::setprecision(2) << opt.iv
              << "\n delta              : " << std::fixed << std::setprecision(4) << opt.delta
              << "\n theta              : " << std::fixed << std::setprecision(4) << opt.theta
              << "\n gamma              : " << std::fixed << std::setprecision(4) << opt.gamma
              << "\n vega               : " << std::fixed << std::setprecision(4) << opt.vega
              << "\n exchFeedTime       : " << std::fixed << std::setprecision(0) << opt.exchFeedTime
              << "\n signal             : " << std::fixed << std::setprecision(0) << opt.signal
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

    while (running) {
        printController(*mem.ctrl);
        if (mem.ctrl->systemStatus == 1) {
            wasReady = true;     // Node is up and running
        }
        // If Node sets systemStatus = 0 → it's shutting down, follow it
        if (wasReady && mem.ctrl->systemStatus == 0) {
            std::cout << "[CORE] Node signalled shutdown." << std::endl;
            running = false;
            return;
        }
        std::this_thread::sleep_for(std::chrono::seconds(5));
    }
}

void watchIndex(const ShmMem& mem) {
    while (running) {
        for (int i = 0; i < mem.n_indices; i++) {
            PrintIndex(i, mem.indices[i]);
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(5000));
    }
}

void watchOptions(const ShmMem& mem) {
    while (running) {
        for (int i = 0; i < mem.n_options; i++) {
            printOptions(i, mem.options[i]);
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(5000));
    }
}