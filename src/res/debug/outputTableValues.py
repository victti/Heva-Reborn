import ida_bytes

# List of table start addresses
table_addresses = [
    0x2DFA970,
    0x2DFC9A8,
    0x2DFE9E0,
    0x2E00A18,
    0x2E02A50
]

table_size = 8248  # Estimated size per table
entry_count = table_size // 4  # Assuming each entry is a 4-byte uint32_t

output_file = "tables_dump.txt"

with open(output_file, "w") as f:
    for table_index, table_start in enumerate(table_addresses):
        f.write(f"\nTable {table_index}: Address 0x{table_start:X}\n")
        
        for i in range(entry_count):
            addr = table_start + (i * 4)
            value = ida_bytes.get_dword(addr)
            f.write(f"  Index {i}: Address 0x{addr:X} -> Value 0x{value:08X}\n")

print(f"Dump saved to {output_file}")