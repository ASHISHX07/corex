#pragma once

#include "shmReader.hpp"
#include <atomic>

extern std::atomic<bool> running;

void onSignal(int);
void watchController(const ShmMem& mem);
void watchIndex(const ShmMem& mem);
void watchOptions(const ShmMem& mem);