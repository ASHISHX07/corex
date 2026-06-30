import mmap, sys

_SEGMENT_SIZES = {
    'CONTROLLER_MEM': 28,
    'INDICES_DATA_MEM': 168,
    'OPTIONS_DATA_MEM': 240 * 18
}

def open_segment(name: str, size: int | None = None) -> mmap.mmap:
    """
    Opens a named shared memory segment created by Boost.Interprocess.
    Returns a read-only mmap object. Works on Windows and Linux/MacOs.
    """
    _size = size or _SEGMENT_SIZES.get(name)
    if _size is None:
        raise ValueError(f'[SHM-P] Unknown segment "{name}" - pass size explicitly')

    if sys.platform == 'win32':
        return _open_windows(name, _size)
    else:
        return _open_posix(name)
    
def _open_windows(name: str, size: int) -> mmap.mmap:
    # Boost on Windows creates segments as named file mappings.
    # Python's mmap on Windows uses OpenFileMapping via the tagname parameter.
    return mmap.mmap(
        -1,                 # -1 = not backed by a file descriptor
        size,               # use full size of existing mapping
        tagname=name,       # Windows Named File Mapping - same name Boost used
        access=mmap.ACCESS_READ
    )

def _open_posix(name: str) -> mmap.mmap:
    # Boost on Linux uses POSIX shm_open - segment lives in /dev/shm/<name>
    import os
    fd = os.open(f'/dev/shm/{name}', os.O_RDONLY)
    try:
        mem = mmap.mmap(fd, 0, mmap.MAP_SHARED, mmap.PROT_READ)
    finally:
        os.close(fd)
    return mem