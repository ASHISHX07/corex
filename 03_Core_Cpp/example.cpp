#include <iostream>
#include <thread>
#include <vector>
#include <iomanip>
#include "headers/shmController.hpp"

int main() {
    std::cout << "[CORE] VENN engine booting" << std::endl;

    VENN_Memory mem;

    mem.connectController();
    mem.waitForReady();
    mem.connectToOptionChainStream();

    while (true) {

        for (int i {0}; i < mem.n_indices; i++) {
            IndicsBufferHeader& idx = mem.indicesData[i];
            if (idx.instrument == 1) {
                std::cout << ">> NIFTY" << '\n'
                          << ">> LTP                : " << std::fixed << std::setprecision(2) << idx.ltp << '\n'
                          << ">> EXCHANGE FEED TIME : " << std::fixed << std::setprecision(0) << idx.exchFeedTime << '\n'
                          << ">> HIGH               : " << std::fixed << std::setprecision(2) << idx.high << '\n'
                          << ">> LOW                : " << std::fixed << std::setprecision(2) << idx.low << '\n'
                          << ">> HIGH               : " << std::fixed << std::setprecision(2) << idx.low << '\n'
                          << ">> OPEN               : " << std::fixed << std::setprecision(2) << idx.open << '\n'
                          << ">> CLOSE              : " << std::fixed << std::setprecision(2) << idx.prevClose << '\n'
                          << ">> CHANGE             : " << std::fixed << std::setprecision(2) << idx.ch << '\n'
                          << ">> CHANGE IN %        : " << std::fixed << std::setprecision(2) << idx.chp << '\n';
            }
        }

        for (int i = 0; i < mem.n_options; i++) {
            OptionsBufferHeader& opt = mem.optionChainData[i];

            if ((long long)opt.instrument == 26203254000) {
                std::cout << ">> NIFTY" << '\n'
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
                          << ">> CHANGE IN %        : " << std::fixed << std::setprecision(2) << opt.chp << '\n';
            }
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
    return 0;
}