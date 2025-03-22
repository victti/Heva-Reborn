import ida_bytes

# List of table start addresses
table_addresses = [
    0x2D5A970,
    0x2D5C9A8,
    0x2D5E9E0,
    0x2D60A18,
    0x2D62A50,
    0x2D64A88,
    0x2D66AC0,
    0x2D68AF8,
    0x2D6AB30,
    0x2D6CB68,
    0x2D6EBA0,
    0x2D70BD8,
    0x2D72C10,
    0x2D74C48,
    0x2D76C80,
    0x2D78CB8,
    0xEC2F12D2
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