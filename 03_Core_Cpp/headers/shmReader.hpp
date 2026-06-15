// Opens all SHM segments created by the Node side and exposes typed read-only pointers.
// No writes happen here. Use shmWriter.hpp for all write operations.

#pragma once

#include <boost/interprocess/shared_memory_object.hpp>
#include <boost/interprocess/mapped_region.hpp>
#include <iostream>
#include <thread>
#include <chrono>
#include <memory>
#include "shm-buffer.hpp"

using namespace boost::interprocess;

class ShmMem {
private:
    std::unique_ptr<shared_memory_object>    _shm_ctrl      { nullptr }; 
    std::unique_ptr<mapped_region>           _reg_ctrl      { nullptr };

    std::unique_ptr<shared_memory_object>    _shm_indices   { nullptr }; 
    std::unique_ptr<mapped_region>           _reg_indices   { nullptr };

    std::unique_ptr<shared_memory_object>    _shm_options   { nullptr }; 
    std::unique_ptr<mapped_region>           _reg_options   { nullptr };

    std::unique_ptr<shared_memory_object>    _shm_order     { nullptr }; 
    std::unique_ptr<mapped_region>           _reg_order     { nullptr };

public:

    // ── Exposed pointers (read-only intent, shmWriter.hpp writes through these) ──
    const std::unique_ptr<ControllerHeader>  ctrl       { nullptr };
    const std::unique_ptr<IndicsHeader>      indices    { nullptr };
    const std::unique_ptr<OptionsHeader>     options    { nullptr };
    const std::unique_ptr<OrderHeader>       order      { nullptr };

    int n_indices { 0 };
    int n_options { 0 };

    // ── connect to controller, retry until Node creates it ──
    void connectController() {
        std::cout << "[CORE] Waiting for Controller..." << std::endl;
        while (true) {
            try {
                _shm_ctrl = std::make_unique<shared_memory_object>(open_only, "CONTROLLER_MEM", read_only);
                _reg_ctrl = std::make_unique<mapped_region>(*_shm_ctrl, read_only);
                ctrl      = static_cast<const ControllerHeader*>(_reg_ctrl->get_address());
                std::cout << "[CORE] Controller attached." << std::endl;
                return;
            }
            catch (...) {
                std::this_thread::sleep_for(std::chrono::milliseconds(500));
            }
        }
    }

    // ── block until Node sets systemStatus = 1 (ready) ──────
    void waitForReady() {
        std::cout << "[CORE] Waiting for Node..." << std::endl;
        while (ctrl->systemStatus != 1) {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
        n_indices = ctrl->IndicesCount;
        n_options = ctrl->OptionsCount;
        std::cout << "[CORE] Ready. Indices: " << n_indices << " | Options: " << n_options << std::endl;
    }

    // ── connect indices + options data segments ─────────────
    void connectDataSegments() {
        try {
            _shm_indices    = std::make_unique<shared_memory_object>(open_only, "INDICES_DATA_MEM", read_only);
            _reg_indices    = std::make_unique<mapped_region>(*_shm_indices, read_only);
            indices         = static_cast<const IndicsHeader*>(_reg_indices->get_address());

            _shm_options    = std::make_unqiue<shared_memory_object>(open_only, "OPTIONS_DATA_MEM", read_only);
            _reg_options    = std::make_unique<mapped_region>(*_shm_options, read_only);
            options         = static_cast<const IndicsHeader*>(_reg_options->get_address());

            std::cout << "[CORE] Data segments attached." << std::endl;
        }
        catch (const std::exception& e) {
            std::cerr << "[CORE] ERROR: connectDataSegments: " << e.what() << std::endl;
            exit(1);
        }
    }

    // ── connect order segment ───────────────────────────────
    void connectOrderSegment() {
        try {
            _shm_order = std::make_unique<shared_memory_object>(open_only, "ORDER_MEM", read_only);
            _reg_order = std::make_unique<mapped_region>(*_shm_order, read_only)
            order      = static_cast<const OrderHeader*>(_reg_order->get_address());

            std::cout << "[CORE] Order segment attached." << std::endl;
        }
        catch (const std::exception& e) {
            std::cerr << "[CORE] ERROR connectOrderSegment: " << e.what() << std::endl;
            exit(1);
        }
    }

    // ── Cleanup ─────────────────────────────────────────────
    ~ShmMem() {
        delete _reg_order;      delete _shm_order;
        delete _reg_options;    delete _shm_options;
        delete _reg_indices;    delete _shm_indices;
        delete _reg_ctrl;       delete _shm_ctrl;
    }

    ShmMem(const ShmMem&)            = delete;
    ShmMem& operator=(const ShmMem&) = delete;

};














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