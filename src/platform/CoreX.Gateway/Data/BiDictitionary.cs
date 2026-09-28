namespace CoreX.Gateway.Data;

/// <summary>
/// Bi-Directional Dictionary with O(1) Key -> Value and Value -> Key access.
/// Each Key and Value must be Unique.
/// </summary>
/// <typeparam name="TKey">Key</typeparam>
/// <typeparam name="TValue">Value</typeparam>
internal sealed class BiDictionary<TKey, TValue>
    where TKey : notnull
    where TValue : notnull
{
    private readonly Dictionary<TKey, TValue> _forward = new();
    private readonly Dictionary<TValue, TKey> _reverse = new();

    /// <summary>Try to get value by key.</summary>
    /// <param name="key">Key</param>
    /// <param name="value">Value</param>
    /// <returns>Assigns value to out parameter and returns true if it exists, false otherwise.</returns>
    public bool TryGetValue(TKey key, out TValue? value) =>
        _forward.TryGetValue(key, out value);

    /// <summary>Try to get key by value</summary>
    /// <param name="value">Value</param>
    /// <param name="key">Key</param>
    /// <returns>Assigns key to out parameter and returns true if it exists, false otherwise.</returns>
    public bool TryGetKey(TValue value, out TKey? key) =>
        _reverse.TryGetValue(value, out key);

    /// <summary>Add a Key -> Value and Value -> Key pair.</summary>
    /// <param name="key">Key</param>
    /// <param name="value">Value</param>
    /// <exception cref="ArgumentException">Key or Value already exists.</exception>
    public void Add(TKey key, TValue value)
    {
        if(_forward.ContainsKey(key))
            throw new ArgumentException("Key already exists");

        if (_reverse.ContainsKey(value))
            throw new ArgumentException("Value already exists");

        _forward[key] = value;
        _reverse[value] = key;
    }
    
    /// <summary>Removes the key-value pair associated with the specified key.</summary>
    /// <param name="key">The key of the pair to remove</param>
    /// <returns>True if the pair existed and was removed; otherwise, false.</returns>
    public bool Remove(TKey key)
    {
        if (!_forward.Remove(key, out var value))
            return false;

        _reverse.Remove(value);
        return true;
    }

    /// <summary>Replaces the old value at given key with new value.</summary>
    /// <param name="key">Key</param>
    /// <param name="value">New Value</param>
    /// <exception cref="KeyNotFoundException">Thrown if specified key does not exists.</exception>
    /// <exception cref="ArgumentException">Thrown if new Value already exists.</exception>
    public void Replace(TKey key, TValue value)
    {
        if (!_forward.TryGetValue(key, out var oldValue))
            throw new KeyNotFoundException("Key does not exists.");

        if (EqualityComparer<TValue>.Default.Equals(oldValue, value))
            return;

        if (_reverse.ContainsKey(value))
            throw new ArgumentException("Value already exists.");

        _forward[key] = value;
        _reverse.Remove(oldValue);
        _reverse[value] = key;
    }

    /// <summary>Clears the entire Dictionary.</summary>
    public void Clear()
    {
        _forward.Clear();
        _reverse.Clear();
    }
}