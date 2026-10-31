#include <cstdint>
#include <vector>
#include <memory>
#include "../../include/corex/math.hpp"

using matrix2D    = std::vector<std::vector<double>>;
using matrix2DPtr = std::unique_ptr<matrix2D>;

matrix2DPtr CoreX::Math::getNSizedMatrix(int n)
{
    matrix2DPtr ptr = std::make_unique<matrix2D>();
    ptr->assign(n, std::vector<double>(n, 0.0));

    return ptr;
}