#include <iostream>
#include <thread>
#include <atomic>
#include <vector>
#include <iomanip>
#include <mutex>
#include "headers/shmController.hpp"

std::atomic<bool> running {true};
std::mutex consoleMutex;

void processIndices(VENN_Memory& mem) {
    while(running) {
        for (int i {0}; i < mem.n_indices; i++) {
            IndicsBufferHeader& idx = mem.indicesData[i];
            
            if (idx.instrument == 1) {

                std::lock_guard<std::mutex> lock(consoleMutex);

                std::cout << ">> \033[1;32m[INDEX UPDATED]\033[0m NIFTY50\n"
                          << ">> LTP                : " << std::fixed << std::setprecision(2) << idx.ltp << '\n'
                          << ">> EXCHANGE FEED TIME : " << std::fixed << std::setprecision(0) << idx.exchFeedTime << '\n'
                          << ">> HIGH               : " << std::fixed << std::setprecision(2) << idx.high << '\n'
                          << ">> LOW                : " << std::fixed << std::setprecision(2) << idx.low << '\n'
                          << ">> OPEN               : " << std::fixed << std::setprecision(2) << idx.open << '\n'
                          << ">> CLOSE              : " << std::fixed << std::setprecision(2) << idx.prevClose << '\n'
                          << ">> CHANGE             : " << std::fixed << std::setprecision(2) << idx.ch << '\n'
                          << ">> CHANGE IN %        : " << std::fixed << std::setprecision(2) << idx.chp << '\n'
                          << "------------------------------------------------------------------" << std::endl;
            }
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
}
void processOptions(VENN_Memory& mem) {
    while(running) {
        for (int i {0}; i < mem.n_options; i++) {
            OptionsBufferHeader& opt = mem.optionChainData[i];

            if ((long long)opt.instrument == 1126519236002) {

                std::lock_guard<std::mutex> lock(consoleMutex);

                std::cout << ">> NIFTY              :"  << std::fixed << std::setprecision(0) << opt.instrument << '\n'
                          << ">> LTP                : " << std::fixed << std::setprecision(2) << opt.ltp << '\n'
                          << ">> Vol                : " << std::fixed << std::setprecision(0) << opt.volume << '\n'
                          << ">> Oi                 : " << std::fixed << std::setprecision(0) << opt.oi << '\n'
                          << ">> CHANGE IN OI       : " << std::fixed << std::setprecision(0) << opt.chngInOi << '\n'
                          << ">> TOTAL BUY QTY      : " << std::fixed << std::setprecision(0) << opt.totBuyQty << '\n'
                          << ">> TOTAL SELL QTY     : " << std::fixed << std::setprecision(0) << opt.totSellQty << '\n'
                          << ">> AVG PRICE          : " << std::fixed << std::setprecision(2) << opt.avgTradePrice << '\n'
                          << ">> HIGH               : " << std::fixed << std::setprecision(2) << opt.high << '\n'
                          << ">> LOW                : " << std::fixed << std::setprecision(2) << opt.low << '\n'
                          << ">> HIGH               : " << std::fixed << std::setprecision(2) << opt.low << '\n'
                          << ">> OPEN               : " << std::fixed << std::setprecision(2) << opt.open << '\n'
                          << ">> CLOSE              : " << std::fixed << std::setprecision(2) << opt.prevClose << '\n'
                          << ">> UPPER CKT          : " << std::fixed << std::setprecision(2) << opt.upperCkt << '\n'
                          << ">> LOWER CKT          : " << std::fixed << std::setprecision(2) << opt.lowerCkt << '\n'
                          << ">> EXCHANGE FEED TIME : " << std::fixed << std::setprecision(0) << opt.exchFeedTime << '\n'
                          << ">> CHANGE             : " << std::fixed << std::setprecision(2) << opt.ch << '\n'
                          << ">> CHANGE IN %        : " << std::fixed << std::setprecision(2) << opt.chp << '\n'
                          << "------------------------------------------------------------------" << std::endl;
            }
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
}

int main() {
    std::cout << "[CORE] Starting" << std::endl;

    VENN_Memory mem;

    mem.connectController();
    mem.waitForReady();
    mem.connectToOptionStream();

    std::thread threadIdx(processIndices, std::ref(mem));
    std::thread threadOpt(processOptions, std::ref(mem));

    while (running) {
        std::this_thread::sleep_for(std::chrono::seconds(1));

        if (mem.ctrl->systemStatus == 0) {
            running = false;
        }
    }
    
    threadIdx.join();
    threadOpt.join();

    std::cout << "[CORE] closed" << std::endl;

    return 0;
}