cmake_minimum_required(VERSION 3.10)
project(shm_bridge)

# cmake-js adds "/DELAYLOAD:NODE.EXE" by default on Windows (assuming MSVC).
# This causes GCC/MinGW to crash. We must remove it.
if(WIN32 AND (CMAKE_CXX_COMPILER_ID MATCHES "GNU" OR MINGW))
    message(STATUS "Cleaning up MSVC flags for GCC/MinGW...")
    string(REPLACE "/DELAYLOAD:NODE.EXE" "" CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS}")
    string(REPLACE "/DELAYLOAD:NODE.EXE" "" CMAKE_MODULE_LINKER_FLAGS "${CMAKE_MODULE_LINKER_FLAGS}")
endif()

# Enforce C++20
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# OPTIMIZATIONS
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    # -march=native: Uses Ryzen 7 specific instructions
    # -O3: Max speed
    # -flto: Link Time Optimization
    add_compile_options(-march=native -O3 -flto -Wall)
    add_link_options(-flto -O3)
endif()

# Definitions & Includes
add_definitions(-DNAPI_DISABLE_CPP_EXCEPTIONS)
add_definitions(-DBOOST_DATE_TIME_NO_LIB)

# Sources
file(GLOB SOURCE_FILES "bridge/*.cpp")

# Create Library
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES})

# INCLUDE PATHS (The Fix)
# We must include:
# A. ${CMAKE_JS_INC}  -> The Node.js headers (fixes node_api.h error)
# B. node-addon-api   -> The wrapper headers
# C. Boost            -> Your shared memory library
target_include_directories(${PROJECT_NAME} PRIVATE 
    ${CMAKE_JS_INC}
    "${CMAKE_CURRENT_SOURCE_DIR}/node_modules/node-addon-api"
    ${BOOST_ROOT}
)

# LINK LIBRARIES (This is the FIX)
# We must link against 'node.lib' (provided by cmake-js variable CMAKE_JS_LIB)
target_link_libraries(${PROJECT_NAME} PRIVATE ${CMAKE_JS_LIB})

# Output Settings
set_target_properties(${PROJECT_NAME} PROPERTIES 
                      PREFIX "" 
                      SUFFIX ".node")

if(MSVC)
    target_compile_options(${PROJECT_NAME} PRIVATE /EHsc)
endif()