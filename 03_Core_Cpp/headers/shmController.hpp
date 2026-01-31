#include <boost/interprocess/shared_memory_object.hpp>
#include <boost/interprocess/mapped_region.hpp>
#include <iostream>
#include <thread>
#include "bufferHeaders.hpp"

using namespace boost::interprocess;

class VENN_Memory {
private: 
    shared_memory_object* shm_controller { nullptr };
    mapped_region* region_controller { nullptr };
    shared_memory_object* shm_data { nullptr };
    mapped_region* region_data { nullptr };

public:
    ControllerBufferHeader* ctrl { nullptr };
    OptionChainBufferHeader* optionChainData { nullptr };
    int symbolCount { 0 };

    void connectController() {
        std::cout << "[CORE] Looking for VENN_CONTROLLER..." << std::endl;
        while(true) {
            try {
                shm_controller = new shared_memory_object(open_only, "VENN_CONTROLLER", read_write);
                region_controller = new mapped_region(*shm_controller, read_write);
                ctrl = static_cast<ControllerBufferHeader*>(region_controller->get_address());
                std::cout << "[CORE] Connected to Controller." << std::endl;
                break;
            }
            catch (...) {
                std::this_thread::sleep_for(std::chrono::milliseconds(500));
            }
        }
    }

    void waitForReady() {
        std::cout << "[CORE] Waiting for start" << std::endl;
        while (ctrl -> systemStatus != 1.0) {
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }

        this -> symbolCount = (int)ctrl -> socketSymbolCount;
        std::cout << "[CORE] System READY. Tracking " << symbolCount << " symbols." << std::endl;
    }

    void connectToOptionChainStream() {
        try {
            shm_data = new shared_memory_object(open_only, "OPTION_CHAIN_MEM", read_write);
            region_data = new mapped_region(*shm_data, read_write);
            optionChainData = static_cast<OptionChainBufferHeader*>(region_data->get_address());
            std::cout << "[CORE] Connected to OPTION_CHAIN_MEM." << std::endl;
        } catch (const std::exception& e) {
            std::cerr << "[CORE CRITICAL ERROR] Could not open option chain data stream: " << e.what() << std::endl;
            exit(1);
        }
    }

};