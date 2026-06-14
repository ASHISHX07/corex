#include <napi.h>
#include <memory>
#include <utility>
#include <cstdint>
#include <iostream>
#include <boost/interprocess/shared_memory_object.hpp>
#include <boost/interprocess/mapped_region.hpp>
#include "../headers/shm-buffer.hpp"

using namespace boost::interprocess;

// ── Segment handles (one per named SHM block) ─────────────────────────────────

static std::unique_ptr<shared_memory_object>   g_shm_controller;
static std::unique_ptr<mapped_region>          g_region_controller;

static std::unique_ptr<shared_memory_object>   g_shm_indics;
static std::unique_ptr<mapped_region>          g_region_indics;

static std::unique_ptr<shared_memory_object>   g_shm_opt_chn;
static std::unique_ptr<mapped_region>          g_region_opt_chn;

static std::unique_ptr<shared_memory_object>   g_shm_tbt_depth;
static std::unique_ptr<mapped_region>          g_region_tbt_depth;

static std::unique_ptr<shared_memory_object>   g_shm_order;
static std::unique_ptr<mapped_region>          g_region_order;

// -- Helper: open-or-create + map, return Napi::Buffer ─────────────────────────

static Napi::Value openAndMap(
    Napi::Env& env,
    std::unique_ptr<shared_memory_object>& shm,
    std::unique_ptr<mapped_region>&        region,
    const char*                            name,
    std::size_t                            size
) {
    try {
        if (!shm) {
            shm = std::make_unique<shared_memory_object>(open_or_create, name, read_write);
            shm->truncate(size);
        }
        if (!region) {
            region = std::make_unique<mapped_region>(*shm, read_write);
        }
        return Napi::Buffer<std::uint8_t>::New(
            env,
            static_cast<std::uint8_t*>(region->get_address()),
            region->get_size(),
            [](Napi::Env, std::uint8_t*) {}     // no-op deleter — Boost owns the memory
        );
    }
    catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// ── Exports ───────────────────────────────────────────────────────────────────

// Fixed size — struct layout is known at compile time
Napi::Value getControllerBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env { info.Env() };
    return openAndMap(env, g_shm_controller, g_region_controller, "CONTROLLER", sizeof(ControllerHeader));
}

Napi::Value getIndicsDataBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env { info.Env() };
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::Error::New(env, "[BRIDGE] getIndicesBuffer: size argument required").ThrowAsJavaScriptException();
        return env.Null();
    }
    return openAndMap(env, g_shm_indics, g_region_indics, "INDICES_DATA_MEM", info[0].As<Napi::Number>().Uint32Value());
}

Napi::Value getOptionChainBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env { info.Env() };
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::Error::New(env, "[BRIDGE] getOptionChainBuffer: size argument required").ThrowAsJavaScriptException();
        return env.Null();
    }
    return openAndMap(env, g_shm_opt_chn, g_region_opt_chn, "OPTIONS_DATA_MEM", info[0].As<Napi::Number>().Uint32Value());
}

Napi::Value getTbtDepthBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env { info.Env() };
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::Error::New(env, "[BRIDGE] getTbtDepthBuffer: size argument required").ThrowAsJavaScriptException();
        return env.Null();
    }
    return openAndMap(env, g_shm_tbt_depth, g_region_tbt_depth, "TBT_DEPTH_MEM", info[0].As<Napi::Number>().Uint32Value());
}

Napi::Value getOrderBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env { info.Env() };
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::Error::New(env, "[BRIDGE] getOrderBuffer: size argument required").ThrowAsJavaScriptException();
        return env.Null();
    }
    return openAndMap(env, g_shm_order, g_region_order, "ORDER_MEM", info[0].As<Napi::Number>().Uint32Value());
}

// ── Module init ───────────────────────────────────────────────────────────────

Napi::Object init(Napi::Env env, Napi::Object exports) {
    exports.Set("getControllerBuffer", Napi::Function::New(env, getControllerBuffer));
    exports.Set("getIndicsDataBuffer", Napi::Function::New(env, getIndicsDataBuffer));
    exports.Set("getOptionChainBuffer", Napi::Function::New(env, getOptionChainBuffer));
    exports.Set("getTbtDepthBuffer", Napi::Function::New(env, getTbtDepthBuffer));
    exports.Set("getOrderBuffer", Napi::Function::New(env, getOrderBuffer));
    return exports;
}

NODE_API_MODULE(shm_bridge, init)
