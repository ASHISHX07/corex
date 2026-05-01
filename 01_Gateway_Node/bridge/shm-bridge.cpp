#include <napi.h>
#include <iostream>
#include <memory>
#include <utility>
// Boost interprocess headers
#include <boost/interprocess/shared_memory_object.hpp>
#include <boost/interprocess/mapped_region.hpp>
#include "./headers/optionChainBufferHeader.hpp"

using namespace boost::interprocess;

std::unique_ptr<shared_memory_object> g_shm_controller;
std::unique_ptr<mapped_region> g_region_controller;

std::unique_ptr<shared_memory_object> g_shm_indics;
std::unique_ptr<mapped_region> g_region_indics;

std::unique_ptr<shared_memory_object> g_shm_opt_chn;
std::unique_ptr<mapped_region> g_region_opt_chn;

std::unique_ptr<shared_memory_object> g_shm_tbt_depth;
std::unique_ptr<mapped_region> g_region_tbt_depth;

Napi::Value getControllerBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env() };

    try {
        if(!g_shm_controller) {
            g_shm_controller = std::make_unique<shared_memory_object>(open_or_create, "VENN_CONTROLLER", read_write);
            g_shm_controller->truncate(sizeof(ControllerBufferHeader));
        }
        if(!g_region_controller) {
            g_region_controller = std::make_unique<mapped_region>(*g_shm_controller, read_write);
        }

        return Napi::Buffer<uint8_t>::New(env,
        (uint8_t*)g_region_controller->get_address(),
        g_region_controller->get_size(),
        [](Napi::Env, uint8_t*) {});
    }
    catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value getIndicsDataBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env() };

    uint32_t desiredSize {};

    if (info.Length() > 0 && info[0].IsNumber()) {
        desiredSize = info[0].As<Napi::Number>().Uint32Value();
    }
    else {
        Napi::Error::New(env, "[BRIDGE ERROR] Memory size argument is REQUIRED!").ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        if(!g_shm_indics) {
            g_shm_indics = std::make_unique<shared_memory_object>(open_or_create, "INDICES_DATA_MEM", read_write);
            g_shm_indics->truncate(desiredSize);
        }

        if(g_region_indics == nullptr) {
            g_region_indics = std::make_unique<mapped_region>(*g_shm_indics, read_write);
        }

        // std::cout << "[BRIDGE] Shared Mem 'INDICS_DATA_MEM' opened at: " << g_region_indics->get_address() << std::endl;

        return Napi::Buffer<uint8_t>::New(env,
        (uint8_t*)g_region_indics->get_address(),
        g_region_indics->get_size(),
        [](Napi::Env, uint8_t*) {});
    }

    catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value getOptionChainBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env() };

    uint32_t desiredSize {};

    if (info.Length() > 0 && info[0].IsNumber()) {
        desiredSize = info[0].As<Napi::Number>().Uint32Value();
        // std::cout << "[BRIDGE] Node requested memory size: " << desiredSize << "bytes." << std::endl;
    }
    else {
        Napi::Error::New(env, "[BRIDGE ERROR] Memory size argument is REQUIRED!").ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        if(!g_shm_opt_chn) {
            g_shm_opt_chn = std::make_unique<shared_memory_object>(open_or_create, "OPTIONS_DATA_MEM", read_write);
            g_shm_opt_chn->truncate(desiredSize);
        }

        if(!g_region_opt_chn) {
            g_region_opt_chn =std::make_unique<mapped_region>(*g_shm_opt_chn, read_write);
        }

        // std::cout << "[BRIDGE] Shared Mem 'OPTION_CHAIN_MEM' opened at: " << g_region_opt_chn->get_address() << std::endl;

        return Napi::Buffer<uint8_t>::New(env,
            (uint8_t*)g_region_opt_chn->get_address(),
            g_region_opt_chn->get_size(),
            [](Napi::Env, uint8_t*) {});
    }

    catch (const std::exception& e) {
        // If something breaks (like Boost not finding the path), throw a JS error
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value getTbtDepthBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env() };

    uint32_t desiredSize {};
    
    if (info.Length() > 0 && info[0].IsNumber()) {
        desiredSize = info[0].As<Napi::Number>().Uint32Value();
        // std::cout << "[BRIDGE] Node requested memory size: " << desiredSize << "bytes." << std::endl;
    }
    else {
        Napi::Error::New(env, "[BRIDGE ERROR] Memory size argument is REQUIRED!").ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        if(!g_shm_tbt_depth) {
            g_shm_tbt_depth = std::make_unique<shared_memory_object>(open_or_create, "TBT_DEPTH_MEM", read_write);
            g_shm_opt_chn->truncate(desiredSize);
        }

        if(!g_region_tbt_depth) {
            g_region_tbt_depth = std::make_unique<mapped_region>(*g_shm_tbt_depth, read_write);
        }

        // std::cout << "[BRIDGE] Shared Mem 'TBT_DEPTH_MEM' opened at: " << g_region_tbt_depth->get_address() << std::endl;

        return Napi::Buffer<uint8_t>::New(env,
            (uint8_t*)g_region_tbt_depth->get_address(),
            g_region_tbt_depth->get_size(),
            [](Napi::Env, uint8_t*) {});
    }

    catch (const std::exception& e) {
        // If something breaks (like Boost not finding the path), throw a JS error
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Boilerplate to export the function
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "getControllerBuffer"), Napi::Function::New(env, getControllerBuffer));
    exports.Set(Napi::String::New(env, "getIndicsDataBuffer"), Napi::Function::New(env, getIndicsDataBuffer));
    exports.Set(Napi::String::New(env, "getOptionChainBuffer"), Napi::Function::New(env, getOptionChainBuffer));
    exports.Set(Napi::String::New(env, "getTbtDepthBuffer"), Napi::Function::New(env, getTbtDepthBuffer));
    return exports;
}

NODE_API_MODULE(shm_bridge, Init)