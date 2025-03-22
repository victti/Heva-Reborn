import idaapi
import ida_bytes

# Base address of `table` (from ECX register)
table_base = 0x02DFA8F8  # Adjust as needed
num_tables = 17  # Change based on the number of xorIndex values
entries_per_table = 4  # Adjust based on size

print("\n=== Extracting Multiple Tables ===")

for table_index in range(num_tables):
    table_addr = ida_bytes.get_dword(table_base + table_index * 4)  # Get pointer to tableArray
    print(f"\nTable {table_index}: Address 0x{table_addr:X}")

    for i in range(entries_per_table):
        entry_addr = table_addr + i
        value = ida_bytes.get_byte(entry_addr)
        print(f"  Index {i}: Address 0x{entry_addr:X} -> Value 0x{value:02X}")