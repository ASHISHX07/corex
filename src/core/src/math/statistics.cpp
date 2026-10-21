#include "../../include/corex/math.hpp"

double CoreX::Math::getPcr(int putOi, int callOi)
{
    return (putOi / callOi);
}