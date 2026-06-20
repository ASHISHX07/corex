#include <iostream>
#include <thread>
#include <csignal>
#include "headers/shmReader.hpp"
#include "headers/shmWatcher.hpp"

int main() {
    std::signal(SIGINT, onSignal);
    std::signal(SIGTERM, onSignal);

    ShmMem mem;
    mem.connectController();
    mem.waitForReady();
    mem.connectDataSegments();
    mem.connectOrderSegment();

    std::cout << "[CORE] All segments attached. Watching live data...\n";

    std::thread tCtrl(watchController, std::cref(mem));
    std::thread tIdx(watchIndex, std::cref(mem));
    std::thread tOpt(watchOptions, std::cref(mem));

    tCtrl.join();
    tIdx.join();
    tOpt.join();

    std::cout << "[CORE] Done." << std::endl;
    return 0;

}