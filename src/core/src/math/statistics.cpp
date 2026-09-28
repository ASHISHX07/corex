#include "../../include/corex/math.hpp"

double CoreX::math::Math::getPcr(int putOi, int callOi)
{
    return (putOi / callOi);
}