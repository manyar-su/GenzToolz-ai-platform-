const fs = require('fs');
const path = 'e:\\Website\\GenzTools\\api\\routes\\tools.ts';

try {
  let content = fs.readFileSync(path, 'utf8');
  const search = 'await deductToken((req as AuthRequest).user!.id)';
  const replace = 'await deductToken((req as AuthRequest).user!.id, 1, req.headers.authorization)';
  
  // Replace all occurrences
  const newContent = content.split(search).join(replace);
  
  fs.writeFileSync(path, newContent, 'utf8');
  console.log('Successfully updated tools.ts');
} catch (err) {
  console.error('Error:', err);
}
