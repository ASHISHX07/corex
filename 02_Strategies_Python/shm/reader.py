import struct, json, os
from ._platform import open_segment
from .types import IndexData, OptionData

_OFFSETS_PATH = os.path.join(
    os.path.dirname(__file__),
    '../../runtime/shm-offsets.json'
)

with open(_OFFSETS_PATH) as f:
    OFF = json.load(f)

C = OFF[CONTROLLER]
I = OFF[INDICS]
O = OFF[OPTIONS]

# Sanity-check format sizes match static_asserts
_FMT_INDICS  = '<32sddddddddddqqddddii'
_FMT_OPTIONS = '<32siiiddddqqqqqqdddddddddddqii'

assert struct.calcsize(_FMT_INDICS)  == I['__bytesPerSlot'], \
    f"INDICS format mismatch: got {struct.calcsize(_FMT_OPTIONS)}, expected {I['__bytesPerSlot']}"
assert struct.calcsize(_FMT_OPTIONS) == O['__bytesPerSlot'], \
    f"OPTIONS formate mismatch: got {struct.calcsize(_FMT_OPTIONS)}, expected {I['__bytesPerSlot']}"

class ShmReader:
    def __init__(self):
        try:
            self._ctrl           = open_segment('CONTROLLER_MEM')
            self._indics        = open_segment('INDICES_DATA_MEM')
            self._options       = open_segment('OPTIONS_DATA_MEM')
        except (FileNotFoundError, OSError) as e:
            raise RuntimeError(
                f'[SHM-P] FATAL: Cannot Open segments: {e}\n'
                 '      Is Gateway Node Running?'
            )
        
    def isReady(self) -> bool:
        status, = struct.unpack_from('<i', self._ctrl, C['systemStatus'])
        return status == 1

    def get_option_count(self) -> int:
        n, = struct.unpack_from('<i', self._ctrl, C['OptionsCount'])
        return n
    
    def get_indics_count(self) -> int:
        n, = struct.unpack_from('<i', self._ctrl, C['IndicesCount'])
        return n

    def get_index(self, slot: int = 0) -> IndexData:
        base = slot * I['__bytesPerSlot']
        raw  = struct.unpack_from(_FMT_INDICS, self.indics, base)
        sym  = raw[0].rstrip(b'\x00').decode('utf-8', errors = 'replace')
        return IndexData(sym, *raw[1:])

    def get_all_indices(self) -> list[IndexData]:
        return [self.get_index(i) for i in range(self.get_indics_count())]

    def get_options(self, slot: int) -> OptionData | None:
        base = slot * O['__bytesPerSlot']
        raw  = struct.unpack_from(_FMT_OPTIONS, self._options, base)
        sym  = raw[0].rstrip(b'\x00').decode('utf-8', errors = 'replace')
        return OptionData(sym, *raw[1:]) if sym else None
    
    def get_all_options(self) -> list[OptionData]:
        return [o for i in range(self.get_option_count())
                if (o := self.get_options(i))]
    
    def get_calls(self) -> list[OptionData]:
        return [o for o in self.get_all_options() if o.cp == 1]
    
    def get_puts(self) -> list[OptionData]:
        return [o for o in self.get_all_options() if o.cp == 2]
    
    def close(self):
        for m in (self._ctrl, self._indics, self._options):
            if m: m.close()

    def __enter__(self): return self
    def __exit__(self, *_): self.close()

