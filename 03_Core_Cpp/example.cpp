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

        for (int i = 0; i < mem.symbolCount; i++) {
            OptionChainBufferHeader& symbolData = mem.optionChainData[i];

            if ((long long)symbolData.instrument == 126203254000) {
                std::cout << ">> NIFTY" << '\n'
                          << ">> LTP                : " << std::fixed << std::setprecision(2) << symbolData.ltp << '\n'
                          << ">> Vol                : " << std::fixed << std::setprecision(0) << symbolData.volume << '\n'
                          << ">> Oi                 : " << std::fixed << std::setprecision(0) << symbolData.oi << '\n'
                          << ">> CHANGE IN OI       : " << std::fixed << std::setprecision(0) << symbolData.chngInOi << '\n'
                          << ">> TOTAL BUY QTY      : " << std::fixed << std::setprecision(0) << symbolData.totBuyQty << '\n'
                          << ">> TOTAL SELL QTY     : " << std::fixed << std::setprecision(0) << symbolData.totSellQty << '\n'
                          << ">> AVG PRICE          : " << std::fixed << std::setprecision(2) << symbolData.avgTradePrice << '\n'
                          << ">> HIGH               : " << std::fixed << std::setprecision(2) << symbolData.high << '\n'
                          << ">> LOW                : " << std::fixed << std::setprecision(2) << symbolData.low << '\n'
                          << ">> HIGH               : " << std::fixed << std::setprecision(2) << symbolData.low << '\n'
                          << ">> OPEN               : " << std::fixed << std::setprecision(2) << symbolData.open << '\n'
                          << ">> CLOSE              : " << std::fixed << std::setprecision(2) << symbolData.prevClose << '\n'
                          << ">> UPPER CKT          : " << std::fixed << std::setprecision(2) << symbolData.upperCkt << '\n'
                          << ">> LOWER CKT          : " << std::fixed << std::setprecision(2) << symbolData.lowerCkt << '\n'
                          << ">> EXCHANGE FEED TIME : " << std::fixed << std::setprecision(0) << symbolData.exchFeedTime << '\n'
                          << ">> CHANGE             : " << std::fixed << std::setprecision(2) << std::setprecision(2) << symbolData.ch << '\n'
                          << ">> CHANGE IN %        : " << std::fixed << std::setprecision(2) << symbolData.chp << '\n';
            }
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
    return 0;
}