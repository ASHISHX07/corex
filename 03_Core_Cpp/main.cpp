#include <iostream>
#include <thread>
#include <atomic>
#include <vector>
#include <iomanip>
#include <mutex>
#include <csignal>
#include "headers/shmReader.hpp"

std::atomic<bool> running {true};
// std::mutex consoleMutex;

void onSignal(int) {
    std::cout << "\n[CORE] Shutting down..." << std::endl;
    running = false;
}

void PrintIndex(int slot, const IndicsHeader& idx) {
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
              << "\n delta              : " << std::fixed << std::setprecision(2) << opt.delta
              << "\n theta              : " << std::fixed << std::setprecision(2) << opt.theta
              << "\n gamma              : " << std::fixed << std::setprecision(2) << opt.gamma
              << "\n vega               : " << std::fixed << std::setprecision(2) << opt.vega
              << "\n exchFeedTime       : " << std::fixed << std::setprecision(0) << opt.exchFeedTime
              << "\n signal             : " << std::fixed << std::setprecision(0) << opt.signal
              << std::endl;
} 

void printController(const ControllerHeader& ctrl) {
    std::cout << "[CONTROLLER]"
              << "  system status: " << ctrl.systemStatus
              << "  indices      : " << ctrl.IndicesCount
              << "  options      : " << ctrl.OptionsCount
              << "  signal       : " << ctrl.signal
              << std::endl;
}

void watchController(const ShmMem& mem) {
    while (running) {
        printController(*mem.ctrl);

        // If Node sets systemStatus = 0 → it's shutting down, follow it
        if (mem.ctrl->systemStatus == 0) {
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
    // const int previewSlots = std::min(mem.n_options, 3);
    while (running) {
        for (int i = 0; i < mem.n_options; i++) {
            printOptions(i, mem.options[i]);
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(5000));
    }
}

int main() {
    std::signal(SIGINT, onSignal);
    std::signal(SIGTERM, onSignal);

    std::cout << "[CORE] starting diagnostic mode." << std::endl;

    ShmMem mem;
    mem.connectController();
    mem.waitForReady();
    mem.connectDataSegments();
    mem.connectOrderSegment();

    std::cout << "[CORE] All segments attached. Watching live data...\n" << std::endl;

    std::thread tCtrl (watchController, std::cref(mem));
    std::thread tIdx  (watchIndex,      std::cref(mem));
    std::thread tOpt  (watchOptions,    std::cref(mem));

    tCtrl.join();
    tIdx.join();
    tOpt.join();

    std::cout << "[CORE] Done." << std::endl;
    return 0;

}

// void processIndices(VENN_Memory& mem) {
//     while(running) {
//         for (int i {0}; i < mem.n_indices; i++) {
//             IndicsBufferHeader& idx = mem.indicesData[i];
            
//             if (idx.instrument == 1) {

//                 std::lock_guard<std::mutex> lock(consoleMutex);

//                 std::cout << ">> \033[1;32m[INDEX UPDATED]\033[0m NIFTY50\n"
//                           << ">> LTP                : " << std::fixed << std::setprecision(2) << idx.ltp << '\n'
//                           << ">> EXCHANGE FEED TIME : " << std::fixed << std::setprecision(0) << idx.exchFeedTime << '\n'
//                           << ">> HIGH               : " << std::fixed << std::setprecision(2) << idx.high << '\n'
//                           << ">> LOW                : " << std::fixed << std::setprecision(2) << idx.low << '\n'
//                           << ">> OPEN               : " << std::fixed << std::setprecision(2) << idx.open << '\n'
//                           << ">> CLOSE              : " << std::fixed << std::setprecision(2) << idx.prevClose << '\n'
//                           << ">> CHANGE             : " << std::fixed << std::setprecision(2) << idx.ch << '\n'
//                           << ">> CHANGE IN %        : " << std::fixed << std::setprecision(2) << idx.chp << '\n'
//                           << "------------------------------------------------------------------" << std::endl;
//             }
//         }
//         std::this_thread::sleep_for(std::chrono::milliseconds(100));
//     }
// }
// void processOptions(VENN_Memory& mem) {
//     while(running) {
//         for (int i {0}; i < mem.n_options; i++) {
//             OptionsBufferHeader& opt = mem.optionChainData[i];

//             if ((long long)opt.instrument == 112647227001) {

//                 std::lock_guard<std::mutex> lock(consoleMutex);

//                 std::cout << ">> NIFTY              :"  << std::fixed << std::setprecision(0) << opt.instrument << '\n'
//                           << ">> LTP                : " << std::fixed << std::setprecision(2) << opt.ltp << '\n'
//                           << ">> Vol                : " << std::fixed << std::setprecision(0) << opt.volume << '\n'
//                           << ">> Oi                 : " << std::fixed << std::setprecision(0) << opt.oi << '\n'
//                           << ">> CHANGE IN OI       : " << std::fixed << std::setprecision(0) << opt.chngInOi << '\n'
//                           << ">> TOTAL BUY QTY      : " << std::fixed << std::setprecision(0) << opt.totBuyQty << '\n'
//                           << ">> TOTAL SELL QTY     : " << std::fixed << std::setprecision(0) << opt.totSellQty << '\n'
//                           << ">> AVG PRICE          : " << std::fixed << std::setprecision(2) << opt.avgTradePrice << '\n'
//                           << ">> HIGH               : " << std::fixed << std::setprecision(2) << opt.high << '\n'
//                           << ">> LOW                : " << std::fixed << std::setprecision(2) << opt.low << '\n'
//                           << ">> HIGH               : " << std::fixed << std::setprecision(2) << opt.low << '\n'
//                           << ">> OPEN               : " << std::fixed << std::setprecision(2) << opt.open << '\n'
//                           << ">> CLOSE              : " << std::fixed << std::setprecision(2) << opt.prevClose << '\n'
//                           << ">> UPPER CKT          : " << std::fixed << std::setprecision(2) << opt.upperCkt << '\n'
//                           << ">> LOWER CKT          : " << std::fixed << std::setprecision(2) << opt.lowerCkt << '\n'
//                           << ">> EXCHANGE FEED TIME : " << std::fixed << std::setprecision(0) << opt.exchFeedTime << '\n'
//                           << ">> CHANGE             : " << std::fixed << std::setprecision(2) << opt.ch << '\n'
//                           << ">> CHANGE IN %        : " << std::fixed << std::setprecision(2) << opt.chp << '\n'
//                           << "------------------------------------------------------------------" << std::endl;
//             }
//         }
//         std::this_thread::sleep_for(std::chrono::milliseconds(100));
//     }
// }

// int main() {
//     std::cout << "[CORE] Starting" << std::endl;

//     VENN_Memory mem;

//     mem.connectController();
//     mem.waitForReady();
//     mem.connectToOptionStream();

//     std::thread threadIdx(processIndices, std::ref(mem));
//     std::thread threadOpt(processOptions, std::ref(mem));

//     while (running) {
//         std::this_thread::sleep_for(std::chrono::seconds(1));

//         if (mem.ctrl->systemStatus == 0) {
//             running = false;
//         }
//     }
    
//     threadIdx.join();
//     threadOpt.join();

//     std::cout << "[CORE] closed" << std::endl;

//     return 0;
// }