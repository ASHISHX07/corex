#src/core/CMakeLists.txt

add_library(corex_core STATIC
    src/math/basic-math.cpp
)

target_sources(corex_core PRIVATE
    
)

target_include_directories(corex_core PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/src/engine
    ${CMAKE_CURRENT_SOURCE_DIR}/src/helpers
    ${CMAKE_CURRENT_SOURCE_DIR}/src/math
    ${CMAKE_CURRENT_SOURCE_DIR}/src/models
    ${CMAKE_CURRENT_SOURCE_DIR}/src/strategies
    ${CMAKE_CURRENT_SOURCE_DIR}/src/transport
    ${CMAKE_CURRENT_SOURCE_DIR}/src/types
)

add_executable(corex_app
    src/main.cpp    
)

target_link_libraries(corex_app PRIVATE corex_core)