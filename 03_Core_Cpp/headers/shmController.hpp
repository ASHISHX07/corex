#include <boost/interprocess/shared_memory_object.hpp>
#include <boost/interprocess/mapped_region.hpp>
#include <iostream>
#include <thread>
#include "shm-buffer.hpp"

using namespace boost::interprocess;

class VENN_Memory {
private: 
    shared_memory_object* shm_controller { nullptr };
    mapped_region* region_controller { nullptr };
    shared_memory_object* shm_indices_data { nullptr };
    mapped_region* region_indices_data { nullptr };
    shared_memory_object* shm_options_data { nullptr };
    mapped_region* region_options_data { nullptr };

public:
    ControllerBufferHeader* ctrl { nullptr };
    IndicsBufferHeader* indicesData { nullptr };
    OptionsBufferHeader* optionChainData { nullptr };
    
    int n_indices {0};
    int n_options {0};

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
        while (ctrl -> systemStatus != 1) {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }

        this -> n_indices = ctrl->sIndicesCount;
        this -> n_options = (int)ctrl -> sOptionsCount;
        std::cout << "[CORE] Indices: " << n_indices << " | Options: " << n_options << std::endl;
    }

    void connectToOptionStream() {
        try {
            shm_indices_data = new shared_memory_object(open_only, "INDICES_DATA_MEM", read_write);
            region_indices_data = new mapped_region(*shm_indices_data, read_write);
            indicesData = static_cast<IndicsBufferHeader*>(region_indices_data->get_address());

            shm_options_data = new shared_memory_object(open_only, "OPTIONS_DATA_MEM", read_write);
            region_options_data = new mapped_region(*shm_options_data, read_write);
            optionChainData = static_cast<OptionsBufferHeader*>(region_options_data->get_address());

            std::cout << "[CORE] Memory buffers done" << std::endl;
        }
        catch (const std::exception& e) {
            std::cerr << "[CORE ERROR] Could not open option chain data stream: " << e.what() << std::endl;
            exit(1);
        }
    }

    // ~VENN_Memory() {

    //     delete shm_controller;
    //     delete region_controller;

    //     delete shm_indices_data;
    //     delete region_indices_data;

    //     delete shm_options_data;
    //     delete region_options_data;

    // }

};