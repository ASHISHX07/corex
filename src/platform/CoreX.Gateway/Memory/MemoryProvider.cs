namespace CoreX.Gateway.Memory;

internal sealed class SharedMemory
{
    public MemoryMappedFile shm { get; init; }
    public MemoryMappedViewAccessor View { get; set; }

    public SharedMemory(string name, long size)
    {
        shm = MemoryMappedFile.CreateNew(name, size);
        View = shm.CreateViewAccessor();
    }
}