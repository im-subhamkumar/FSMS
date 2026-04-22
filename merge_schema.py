def merge_by_lines():
    with open('backend/prisma/schema.old.prisma', 'r', encoding='utf-8') as f:
        old_lines = f.readlines()
        
    with open('backend/prisma/schema.prisma', 'a', encoding='utf-8') as f:
        # Extract lines 162 to 215 (index 161 to 215)
        # However, checking the old file, FlyingSlots starts around line 164.
        # Let's cleanly grab 161 to 215.
        flying_slots = old_lines[161:215]
        f.write('\n\n')
        f.writelines(flying_slots)
        
        # Extract lines 411 to end
        dms_courses = old_lines[410:]
        f.write('\n\n')
        f.writelines(dms_courses)

if __name__ == '__main__':
    merge_by_lines()
