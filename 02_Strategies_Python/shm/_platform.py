import mmap, sys

def open_segment(name: str) -> mmap.mmap:
    """
    Opens a named shared memory segment created by Boost.Interprocess.
    Returns a read-only mmap object. Works on Windows and Linux/MacOs.
    """
    if sys.platform == 'win32':
        return _open_windows(name)
    else:
        return _open_posix(name)
    
def _open_windows(name: str) -> mmap.mmap:
    # Boost on Windows creates segments as named file mappings.
    # Python's mmap on Windows uses OpenFileMapping via the tagname parameter.
    return mmap.mmap(
        -1,                 # -1 = not backed by a file descriptor
        0,                  # 0  = use full size of existing mapping
        tagname=name,       # Windows Named File Mapping - same name Boost used
        access=mmap.ACCESS_READ
    )

def open_posix(name: str) -> mmap.mmap:
    # Boost on Linux uses POSIX shm_open - segment lives in /dev/shm/<name>
    import os
    fd = os.open(f'/dev/shm/{name}', os.O_RDONLY)
    try:
        mem = mmap.mmap(fd, 0, mmap.MAP_SHARED, mmap.PROT_READ)
    finally:
        os.close(fd)
    return mem