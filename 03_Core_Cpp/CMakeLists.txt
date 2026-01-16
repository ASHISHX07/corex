cmake_minimum_required(VERSION 3.10)
project(venn_core)

set(CMAKE_CXX_STANDARD 20)

if(CMAKE_CXX_COMPILER_ID MATCHES "GNU/Clang")
    add_compile_options(-march=native -O3 -flto -Wall)
endif()

# --- SOURCES ---
file(GLOB SOURCE_FILES "*.cpp" "importers/*.cpp")

# --- EXETUABLE ---
add_executable(venn_core ${SOURCE_FILES})

target_include_directories(venn_core PRIVATE
    "headers"
    ${BOOST_ROOT}
)