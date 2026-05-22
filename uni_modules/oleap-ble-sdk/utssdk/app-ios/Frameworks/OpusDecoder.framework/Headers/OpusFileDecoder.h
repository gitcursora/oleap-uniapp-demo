//
//  OpusFileDecoder.h
//  OpusFileDecoder
//
//  Created by drops on 2024/6/16.
//

#ifndef OpusFileDecoder_h
#define OpusFileDecoder_h

//转换出错的错误码
enum {
    ErrOpenOpusFile    = -1,
    ErrOpenOutputFile  = -2,
    ErrCreatDecoder    = -3,
    ErrReadOpusHeader  = -4,
    ErrReadOpusPayload = -5,
    ErrDecodedDataSize = -7,
    ErrMP3EncoderInit  = -8,
    ErrMP3EncoderWrite = -10,
};

//可忽略的错误码
enum {
    ErrOpusDecode      = 1,
    ErrMP3EncoderEncode= 2,
};

/// 将opus文件转换成wav文件
/// - Parameters:
///   - opusFilePath: opus本地文件路径
///   - outPutWavPath: 转换后生成的wav文件路径
///   返回值： 0 - 所有帧都转换成功，大于0 - 成功（但部分帧转换失败），小于0 - 转换失败
int opus2wav(const char *opusFilePath, const char *outPutWavPath);

/// 将opus文件转换成mp3文件
/// - Parameters:
///   - opusFilePath: opus本地文件路径
///   - outPutWavPath: 转换后生成的mp3文件路径
///   - bitrate 生成的mp3比特率，单位kb
///   返回值： 0 - 所有帧都转换成功，大于0 - 成功（但部分帧转换失败），小于0 - 转换失败
int opus2mp3(const char *input_filename, const char *output_filename, int bitrate);

#endif
