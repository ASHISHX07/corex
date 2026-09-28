#include <cstdint>
#include <array>

namespace CoreX::types
{
    struct optionGreeks
    {
        double delta {};
        double gamma {};
        double theta {};
        double vega {};
        double iv {};
    };

    struct FyersWBIndex final
    {
        std::int32_t symbolId {};
        double ltp {};
        double prevClose {};
        double dayHigh {};
        double dayLow {};
        double open {};
        double ch {};
        double chp {};
        double fp {};
        double fpch {};
        double fpchp {};
        double iVix {};
        double iVixCh {};
        double iVixChp {};
        std::int64_t exchFeedTime {};
        std::int32_t callOi {};
        std::int32_t putOi {}; 
        int expiryLength {};
    };

    struct FyersOptionChainData final
    {
        std::int32_t symbolId {};
        double ltp {};
        double prevClose {};
        double dayHigh {};
        double dayLow {};
        double open {};
        double ch {};
        double chp {};
        std::int64_t dayVol {};
        std::int64_t lastTradedTime {};
        std::int64_t lastTradedQty {};
        std::int64_t exchFeedTime {};
        std::int64_t bidSize {};
        std::int64_t askSize {};
        double bidPrice {};
        double askPrice {};
        std::int64_t totalBuyQty {};
        std::int64_t totalSellQty {};
        std::int64_t avgTradePrice {};
        std::int64_t oi {};
        std::int64_t oich {};
        std::int64_t oichp {};
        std::int64_t prevOi {};
        std::int32_t strike {};
        optionGreeks greeks {};
    };

    struct FyersTbtMarkteDepth
    {
        
    };
}
