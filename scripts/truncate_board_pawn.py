# Remove the old flat Pawn function from Board.tsx (replaced by Pawn3D component)
p = '/home/z/my-project/src/components/ludo/Board.tsx'
src = open(p).read()
marker = '// ---------------- Pawn (premium round token) ----------------'
i = src.index(marker)
open(p, 'w').write(src[:i].rstrip() + '\n')
print('truncated at', i, '— new length', len(src[:i]))
