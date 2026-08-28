#CMakeLists.txt (root)

cmake_minimum_required(VERSION 4.3.1)
project(CoreX VERSION 1.0.0 LANGUAGES CXX)

if(NOT DEFINED CMAKE_CXX_COMPILER)
	find_program(CMAKE_CXX_COMPILER NAMES g++ REQUIRED)
endif()

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)   # gives Intellisense the symbol index

add_subdirectory(src/core)