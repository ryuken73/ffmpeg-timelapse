exports.timelapseOptions = speed => {

  return [
    {
      filter: 'setpts',
      options: `${1/speed}*PTS`,
      outputs: '[vsetpts]'
    },
    {
      inputs: '[vsetpts]',
      filter: "crop",
      options: "in_w:in_w*9/16",
      outputs: '[vcrop]'
    },
    {
      inputs: '[vcrop]',
      filter: 'scale',
      options: '1920:1080',
      outputs: '[vscale]'
    },
    {
      inputs: '[vscale]',
      filter: 'format',
      options: {"pix_fmts": "uyvy422"},
    }
  ]
}