cmake_minimum_required(VERSION 3.10)
project(main)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_definitions(-DBOOST_DATE_TIME_NO_LIB)

if(NOT Boost_FOUND)
set(BOOST_ROOT $ENV{BOOST_ROOT})
endif()
find_package(Boost QUIET)

# --- SOURCES ---
set(SOURCE_FILES
    main.cpp
    shm/shmWatcher.cpp
)

# file(GLOB SOURCE_FILES 
#     "*.cpp"
#     "execution-core/*.cpp"
#     "shm/*.cpp"
#     "models/*.cpp"
# )

# --- EXETUABLE ---
add_executable(main ${SOURCE_FILES})

target_compile_options(main PRIVATE
    $<IF:$<CONFIG:Release>,-O3 -march=native -flto -Wall,-O0 -g -Wall>
)
target_link_options(main PRIVATE
    $<$<CONFIG:Release>:-flto -O3>
)

target_include_directories(main PRIVATE
    "headers"
    ${BOOST_ROOT}
    ${Boost_INCLUDE_DIRS}
)
