cmake_minimum_required(VERSION 3.15)
project(shm_bridge)

# cmake-js adds "/DELAYLOAD:NODE.EXE" by default on Windows (assuming MSVC).
# This causes GCC/MinGW to crash. We must remove it.
if(WIN32 AND CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    message(STATUS "Cleaning up MSVC flags for GCC/MinGW...")
    string(REPLACE "/DELAYLOAD:NODE.EXE" "" CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS}")
    string(REPLACE "/DELAYLOAD:NODE.EXE" "" CMAKE_MODULE_LINKER_FLAGS "${CMAKE_MODULE_LINKER_FLAGS}")
endif()

# Enforce C++20
set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Definitions & Includes
add_definitions(-DNAPI_DISABLE_CPP_EXCEPTIONS -DBOOST_DATE_TIME_NO_LIB)

# Boost - auto-detect on Linux, use BOOST_ROOT on Windows
find_package(Boost QUIET)
if(NOT Boost_FOUND)
    set(BOOST_ROOT $ENV{BOOST_ROOT})
endif()

# Sources
file(GLOB SOURCE_FILES "src/*.cpp")

# Create Library
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES})

# Release: full optimization. Debug: symbols only, no optimization
target_compile_options(${PROJECT_NAME} PRIVATE
    $<IF:$<CONFIG:Release>,-O3 -march=native -flto -Wall,-O0 -g -Wall>
)
target_link_options(${PROJECT_NAME} PRIVATE
    $<$<CONFIG:Release>:-flto -O3>
)
# ${CMAKE_JS_INC}  -> The Node.js headers
# node-addon-api   -> The wrapper headers
# Boost            -> shared memory library
target_include_directories(${PROJECT_NAME} PRIVATE 
    ${CMAKE_JS_INC}
    "${CMAKE_CURRENT_SOURCE_DIR}/../node_modules/node-addon-api"
    ${BOOST_ROOT}
    ${Boost_INCLUDE_DIRS}
)

# LINK LIBRARIES (This is the FIX)
# We must link against 'node.lib' (provided by cmake-js variable CMAKE_JS_LIB)
target_link_libraries(${PROJECT_NAME} PRIVATE ${CMAKE_JS_LIB})

# Output Settings
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

if(MSVC)
    target_compile_options(${PROJECT_NAME} PRIVATE /EHsc)
endif()