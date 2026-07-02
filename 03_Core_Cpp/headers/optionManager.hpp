#pragma once

#include "shmManager.hpp"
#include <string>
#include <vector>
#include <optional>

class OptionManager {
private:
    const ShmMem& _mem;

public:
    explicit OptionManager(const ShmMem& mem) : _mem { mem } {}

    // ── Index ────────────────────────────────────────────
    double getSpotPrice(const int& slot) const;
    double getFuturesPrice(const int& slot) const;

    // ── Strike lookup ────────────────────────────────────
    int getAtmStrike(const int& slot, const bool& isNifty = true) const;     // nearest strike to spot
    const OptionsHeader* getOption(int* strike, const std::string& type) const;  // CE or PE
    std::pair<const OptionsHeader*, const OptionsHeader*> getPair(int strike) const; // CE + PE

    // ── Chain analytics ──────────────────────────────────
    double getPCR() const;
    int getMaxOIStrike(const std::string& type) const;
    double getTotalCallOI() const;
    double getTotalPutOI() const;

    // ── Iteration helpers ────────────────────────────────
    std::vector<const OptionsHeader*> getCalls() const;
    std::vector<const OptionsHeader*> getPuts() const;
};