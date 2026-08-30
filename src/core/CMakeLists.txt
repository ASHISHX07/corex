add_library(corex_core STATIC
    src/math/basic-math.cpp
)

target_compile_features(corex_core PUBLIC cxx_std_23)

target_include_directories(corex_core PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_include_directories(corex_core PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/src/engine
    ${CMAKE_CURRENT_SOURCE_DIR}/src/helpers
    ${CMAKE_CURRENT_SOURCE_DIR}/src/math
    ${CMAKE_CURRENT_SOURCE_DIR}/src/models
    ${CMAKE_CURRENT_SOURCE_DIR}/src/strategies
    ${CMAKE_CURRENT_SOURCE_DIR}/src/transport
    ${CMAKE_CURRENT_SOURCE_DIR}/src/types
)

add_executable(corex
    src/main.cpp    
)

target_link_libraries(corex PRIVATE corex_core)
