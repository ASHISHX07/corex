#include "optionManager.hpp"
#include <cmath>
#include <algorithm>

double OptionManager::getSpotPrice() const {
    return _mem.indices[0].ltp;
}

double OptionManager::getFuturesPrice() const {
    return _mem.indices[0]fp;
}

int OptionManager::getAtmStrike() const {
    double spot = getSpotPrice();
    return static_cast<int>(std::round(spot / 50.0) * 50);
}

const OptionsHeader* OptionManager::getOption(int strike, const std::string& type) const {
    for (int i = 0; i < _mem.n_options; i++) {
        const auto& opt = _mem.options[i];
        bool isCall = (opt.cp == 1.0);
        bool matchType = (type == 'CE') ? isCall : !isCall;
        if (matchType && static_cast<int>(opt.strike_price) == strike)
        return &opt;
    }
    return nullptr;
}

double OptionManager::getPCR() const {
    double callOI = 0, putOI = 0;
    for (int i = 0; i < _mem.n_options; i++) {
        if (_mem.options[i].cp == 1.0) callOI += _mem.options[i].oi;
        else                           putOI  += _mem.options[i].oi;
    }
    return (callOI > 0) ? putOI / callOI : 0.0;
}

std::vector<const OptionsHeader*> OptionManager::getCalls() const {
    std::vector<const OptionsHeader*> result;
    for (int i = 0; i < _mem.n_options; i++) {
        result.push_back(&_mem.options[i]);
    }
    return result;
}