const { dockStart } = require('@nlpjs/basic');
const { resolve } = require('path');

(async () => {
    const dock = await dockStart({ use: ['Basic']});
    const nlp = dock.get('nlp');
    await nlp.addCorpus(resolve(__dirname, './training.json'));
    await nlp.train();
    nlp.save('./model.nlp', true);
})();