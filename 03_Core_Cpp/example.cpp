#include <iostream>
#include <thread>
#include <vector>
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
                std::cout << ">> NIFTY CE | LTP: " << std::fixed << symbolData.ltp << '\n'
                          << ">> Vol: " << std::fixed << symbolData.volume << '\n'
                          << ">> Oi: " << std::fixed << symbolData.oi << '\n'
                          << ">> exchange feed time: " << std::fixed << symbolData.exchFeedTime << std::endl;
            }
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(1000));
    }
    return 0;
}