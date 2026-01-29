#include <napi.h>
#include <iostream>
// Boost interprocess headers
#include <boost/interprocess/shared_memory_object.hpp>
#include <boost/interprocess/mapped_region.hpp>
#include "./headers/optionChainBufferHeader.h"

using namespace boost::interprocess;

shared_memory_object* g_shm{ nullptr };
mapped_region* g_region{ nullptr };

// this function will be called from javascript
Napi::Value GetSharedBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env{ info.Env() };

    try {
        if(g_shm == nullptr) {
            // Create the Shared Memory Object named "TEST_MEM"
            // "open_or_create" means: if it exists, open it; if not, create it.
            g_shm = new shared_memory_object(open_or_create, "OPTION_CHAIN_MEM", read_write);
            // Set the size. We use a hardcoded size or sizeof(YourStruct)
            //Let's allocate 1024 bytes to be safe
            g_shm->truncate(sizeof(TradeData));
        }

        // Map the memory into this process so we can touch it
        if(g_region == nullptr) {
            g_region = new mapped_region(*g_shm, read_write);
        }

        // Get the raw address (pointer) of that memory
        void* ptr = g_region->get_address();
        size_t size = g_region->get_size();

        std::cout << "[BRIDGE] Shared Memory 'TEST_MEM' opened at: " << ptr << std::endl;

        // Wrap it in a Node.js Buffer (Zero Copy!)
        // This lets JS read/write this RAM directly.
        return Napi::Buffer<uint8_t>::New(env, (uint8_t*)ptr, size, [](Napi::Env, uint8_t*) {});
    }

    catch (const std::exception& e) {
        // If something breaks (like Boost not finding the path), throw a JS error
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Boilerplate to export the function

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "getSharedBuffer"),
                Napi::Function::New(env, GetSharedBuffer));
    return exports;
}

NODE_API_MODULE(shm_bridge, Init)