const ffmpeg = require('fluent-ffmpeg');
const {timelapseOptions} = require('./config/timelapse_options');

const FFMPEG_DEFAULT_IN_OPTIONS = ['-dts_delta_threshold', 10];
const FFMPEG_DEFAULT_OUT_OPTIONS = [];
const FFMPEG_DEFAULT_BINARY = process.env.FFMPEG || './bin/ffmpeg.exe';

const runFFMpeg = (inFile, outFile, options={}, ffmpegBinary=FFMPEG_DEFAULT_BINARY) => {
  const {inputOptions=[], outputOptions=[], complexFilters=[]} = options;
  // if file path contains back slash, ffmpeg fails. replace!
  const srcNormalized = inFile.replace(/\\/g, '/'); 
  const mergedInOptions = [...FFMPEG_DEFAULT_IN_OPTIONS, ...inputOptions];
  const mergedOutOptions = [...FFMPEG_DEFAULT_OUT_OPTIONS, ...outputOptions];
  ffmpeg.setFfmpegPath(ffmpegBinary);
  return new Promise((resolve, reject) => {
      const command = 
        ffmpeg(srcNormalized)
        .inputOptions(mergedInOptions)
        .outputOptions(mergedOutOptions) 
        .output(outFile)
        .on('progress', progress => console.log(progress))
        .on('start', cmd => console.log('started: ',cmd))
        .on('error', error => {
            console.log(error);
            reject(error)
        })
        .on('end', (stdout, stderr) => {
            resolve(true)
        })

      if(complexFilters.length > 0){
        command.complexFilter(complexFilters);
      }
      command.run();
  })
}

const mkTimelapse = (inFile, outFile, speed, ffmpegBinary=FFMPEG_DEFAULT_BINARY) => {
  const doubleSpeedOptions = timelapseOptions(speed)
  const options = {
    inputOptions: [],
    outputOptions: ['-y', '-top 1', '-r 60'],
    complexFilters: doubleSpeedOptions
  }
  return runFFMpeg(inFile, outFile, options, ffmpegBinary)
}

// example
// const inFile = "http:/10.10.204.203/channel4/channel4_20230904-120132_1693796492508_부산 동래구 세병교 온천천/channel4_stream.m3u8";
// const outFile = "d:/temp/timelapse.mp4";
// mkTimelapse(inFile, outFile, 2)

module.exports = {
  runFFMpeg,
  mkTimelapse
}

