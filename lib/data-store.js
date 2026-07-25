const fs = require('fs');
class DataStore {
  constructor(filePath, seed) { this.filePath = filePath; this.seed = seed; }
  read() { if (!fs.existsSync(this.filePath)) this.write(structuredClone(this.seed)); const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8')); for (const key of ['users', 'sessions', 'integrations', 'audit', 'workflows', 'notifications']) { if (!data[key]) data[key] = structuredClone(this.seed[key]); } return data; }
  write(data) { const temporaryPath = `${this.filePath}.tmp`; fs.writeFileSync(temporaryPath, JSON.stringify(data, null, 2), 'utf8'); fs.renameSync(temporaryPath, this.filePath); }
}
module.exports = DataStore;
