const fs = require('fs');
const path = require('path');
const {PromisePool} = require('@supercharge/promise-pool');
const {mkTimelapse} = require('./ffmpeg_util');

const OUT_DIR = process.env.OUT_DIR || `d:/temp`;
const CLIP_STORE_FILE = process.env.CLIP_STORE_FILE || './sources/clipStore.json';
const TIMELAPSE_SPEED = process.env.TIMELAPSE_SPEED || 60;
const JOB_CONCURRENCY = process.env.JOB_CONCURRENCY || 5;
const MAX_JOBS = process.env.MAX_JOBS || 10;

const initDoneDataSet = async (targetDir) => {
  const files = await fs.promises.readdir(targetDir);
  const fnames = files.map(file => path.basename(file).split('.')[0]);
  console.log(fnames)
  return new Set([...fnames]);
}
const getSourcesObj = async (storeFile) => {
  return JSON.parse(await fs.promises.readFile(storeFile));
}
const getSourceFiles = (sourcesObj, dbSet) => {
  const currentClips = Object.keys(sourcesObj);
  const toRunClipKeys = currentClips.filter(clip => {
    return !dbSet.has(clip);
  })
  return toRunClipKeys.map(key => {
    const sourceFile = sourcesObj[key].hlsm3u8;
    const targetFile = path.join(OUT_DIR, `${key}.mp4`);
    return [sourceFile, targetFile]
  })
}

async function main(){
  const dbSet = await initDoneDataSet(OUT_DIR);
  try {
    const sourcesObj = await getSourcesObj(CLIP_STORE_FILE);
    const fileList = getSourceFiles(sourcesObj, dbSet);
    console.log('number of clips to make timelaps:', fileList.length);
    console.log('10s of source file is ', fileList.slice(0,10))
    const jobsToRun = fileList.slice(0, MAX_JOBS);
    const {results, errors} = await PromisePool
      .withConcurrency(parseInt(JOB_CONCURRENCY))
      .for(jobsToRun)
      .onTaskStarted((item) => {console.log('started:', item)})
      .onTaskFinished((item) => {console.log('ended:', item)})
      .process(async (filesArray) => {
        const [inFile, outFile] = filesArray
        return await mkTimelapse(inFile, outFile, TIMELAPSE_SPEED)
      })
  } catch (err) {
    console.error(err);
  }
}

main()