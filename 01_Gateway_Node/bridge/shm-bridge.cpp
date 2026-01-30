#include <napi.h>
#include <iostream>
// Boost interprocess headers
#include <boost/interprocess/shared_memory_object.hpp>
#include <boost/interprocess/mapped_region.hpp>
#include "./headers/optionChainBufferHeader.h"

using namespace boost::interprocess;

struct ControllerData {
    double systemStatus;
    double socketSymbolCount;
    double tbtSocketSymbolCount;
    double apiSymbolCount;
    double marketDepthCount;
};

shared_memory_object* g_shm_controller{ nullptr };
mapped_region* g_region_controller{ nullptr };

shared_memory_object* g_shm_opt_chn{ nullptr };
mapped_region* g_region_opt_chain{ nullptr };

Napi::Value getControllerBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env() };

    try {
        if(g_shm_controller == nullptr) {
            g_shm_controller = new shared_memory_object(open_or_create, "VENN_CONTROLLER", read_write);
            g_shm_controller->truncate(sizeof(ControllerData));
        }
        if(g_region_controller == nullptr) {
            g_region_controller = new mapped_region(*g_shm_controller, read_write);
        }

        std::cout << "[BRIDGE] CONTROLLER MEMORY CREATED" << std::endl;

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

// this function will be called from javascript
Napi::Value getOptionChainBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env() };

    uint32_t desiredSize {1024 * 1024};

    if (info.Length() > 0 && info[0].IsNumber()) {
        desiredSize = info[0].As<Napi::Number>().Uint32Value();
        std::cout << "[BRIDGE] Node requested memory size: " << desiredSize << "bytes." << std::endl;
    }

    try {
        if(g_shm_opt_chn == nullptr) {
            // Create the Shared Memory Object named "OPTION_CHAIN_MEM"
            // "open_or_create" means: if it exists, open it; if not, create it.
            g_shm_opt_chn = new shared_memory_object(open_or_create, "OPTION_CHAIN_MEM", read_write);
            // Set the size. We use a hardcoded size or sizeof(YourStruct)
            //Let's allocate 1024 bytes to be safe
            g_shm_opt_chn->truncate(desiredSize);
        }

        // Map the memory into this process so we can touch it
        if(g_region_opt_chain == nullptr) {
            g_region_opt_chain = new mapped_region(*g_shm_opt_chn, read_write);
        }

        // Get the raw address (pointer) of that memory

        std::cout << "[BRIDGE] Shared Memory 'OPTION_CHAIN_MEM' opened at: " << g_region_opt_chain->get_address() << std::endl;

        // Wrap it in a Node.js Buffer (Zero Copy!)
        // This lets JS read/write this RAM directly.
        return Napi::Buffer<uint8_t>::New(env,
            (uint8_t*)g_region_opt_chain->get_address(),
            g_region_opt_chain->get_size(),
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
    exports.Set(Napi::String::New(env, "getOptionChainBuffer"), Napi::Function::New(env, getOptionChainBuffer));
    return exports;
}

NODE_API_MODULE(shm_bridge, Init)