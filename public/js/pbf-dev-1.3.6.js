(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Pbf = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

// lightweight Buffer shim for pbf browser build
// based on code from github.com/feross/buffer (MIT-licensed)

module.exports = Buffer;

var ieee754 = require('ieee754');

var BufferMethods;

function Buffer(length) {
    var arr;
    if (length && length.length) {
        arr = length;
        length = arr.length;
    }
    var buf = new Uint8Array(length || 0);
    if (arr) buf.set(arr);

    buf.readUInt32LE = BufferMethods.readUInt32LE;
    buf.writeUInt32LE = BufferMethods.writeUInt32LE;
    buf.readInt32LE = BufferMethods.readInt32LE;
    buf.writeInt32LE = BufferMethods.writeInt32LE;
    buf.readFloatLE = BufferMethods.readFloatLE;
    buf.writeFloatLE = BufferMethods.writeFloatLE;
    buf.readDoubleLE = BufferMethods.readDoubleLE;
    buf.writeDoubleLE = BufferMethods.writeDoubleLE;
    buf.toString = BufferMethods.toString;
    buf.write = BufferMethods.write;
    buf.slice = BufferMethods.slice;
    buf.copy = BufferMethods.copy;

    buf._isBuffer = true;
    return buf;
}

var lastStr, lastStrEncoded;

BufferMethods = {
    readUInt32LE: function(pos) {
        return ((this[pos]) |
            (this[pos + 1] << 8) |
            (this[pos + 2] << 16)) +
            (this[pos + 3] * 0x1000000);
    },

    writeUInt32LE: function(val, pos) {
        this[pos] = val;
        this[pos + 1] = (val >>> 8);
        this[pos + 2] = (val >>> 16);
        this[pos + 3] = (val >>> 24);
    },

    readInt32LE: function(pos) {
        return ((this[pos]) |
            (this[pos + 1] << 8) |
            (this[pos + 2] << 16)) +
            (this[pos + 3] << 24);
    },

    readFloatLE:  function(pos) { return ieee754.read(this, pos, true, 23, 4); },
    readDoubleLE: function(pos) { return ieee754.read(this, pos, true, 52, 8); },

    writeFloatLE:  function(val, pos) { return ieee754.write(this, val, pos, true, 23, 4); },
    writeDoubleLE: function(val, pos) { return ieee754.write(this, val, pos, true, 52, 8); },

    toString: function(encoding, start, end) {
        var str = '',
            tmp = '';

        start = start || 0;
        end = Math.min(this.length, end || this.length);

        for (var i = start; i < end; i++) {
            var ch = this[i];
            if (ch <= 0x7F) {
                str += decodeURIComponent(tmp) + String.fromCharCode(ch);
                tmp = '';
            } else {
                tmp += '%' + ch.toString(16);
            }
        }

        str += decodeURIComponent(tmp);

        return str;
    },

    write: function(str, pos) {
        var bytes = str === lastStr ? lastStrEncoded : encodeString(str);
        for (var i = 0; i < bytes.length; i++) {
            this[pos + i] = bytes[i];
        }
    },

    slice: function(start, end) {
        return this.subarray(start, end);
    },

    copy: function(buf, pos) {
        pos = pos || 0;
        for (var i = 0; i < this.length; i++) {
            buf[pos + i] = this[i];
        }
    }
};

BufferMethods.writeInt32LE = BufferMethods.writeUInt32LE;

Buffer.byteLength = function(str) {
    lastStr = str;
    lastStrEncoded = encodeString(str);
    return lastStrEncoded.length;
};

Buffer.isBuffer = function(buf) {
    return !!(buf && buf._isBuffer);
};

function encodeString(str) {
    var length = str.length,
        bytes = [];

    for (var i = 0, c, lead; i < length; i++) {
        c = str.charCodeAt(i); // code point

        if (c > 0xD7FF && c < 0xE000) {

            if (lead) {
                if (c < 0xDC00) {
                    bytes.push(0xEF, 0xBF, 0xBD);
                    lead = c;
                    continue;

                } else {
                    c = lead - 0xD800 << 10 | c - 0xDC00 | 0x10000;
                    lead = null;
                }

            } else {
                if (c > 0xDBFF || (i + 1 === length)) bytes.push(0xEF, 0xBF, 0xBD);
                else lead = c;

                continue;
            }

        } else if (lead) {
            bytes.push(0xEF, 0xBF, 0xBD);
            lead = null;
        }

        if (c < 0x80) bytes.push(c);
        else if (c < 0x800) bytes.push(c >> 0x6 | 0xC0, c & 0x3F | 0x80);
        else if (c < 0x10000) bytes.push(c >> 0xC | 0xE0, c >> 0x6 & 0x3F | 0x80, c & 0x3F | 0x80);
        else bytes.push(c >> 0x12 | 0xF0, c >> 0xC & 0x3F | 0x80, c >> 0x6 & 0x3F | 0x80, c & 0x3F | 0x80);
    }
    return bytes;
}

},{"ieee754":3}],2:[function(require,module,exports){
(function (global){
'use strict';

module.exports = Pbf;

var Buffer = global.Buffer || require('./buffer');

function Pbf(buf) {
    this.buf = !Buffer.isBuffer(buf) ? new Buffer(buf || 0) : buf;
    this.pos = 0;
    this.length = this.buf.length;
}

Pbf.Varint  = 0; // varint: int32, int64, uint32, uint64, sint32, sint64, bool, enum
Pbf.Fixed64 = 1; // 64-bit: double, fixed64, sfixed64
Pbf.Bytes   = 2; // length-delimited: string, bytes, embedded messages, packed repeated fields
Pbf.Fixed32 = 5; // 32-bit: float, fixed32, sfixed32

var SHIFT_LEFT_32 = (1 << 16) * (1 << 16),
    SHIFT_RIGHT_32 = 1 / SHIFT_LEFT_32,
    POW_2_63 = Math.pow(2, 63);

Pbf.prototype = {

    destroy: function() {
        this.buf = null;
    },

    // === READING =================================================================

    readFields: function(readField, result, end) {
        end = end || this.length;

        while (this.pos < end) {
            var val = this.readVarint(),
                tag = val >> 3,
                startPos = this.pos;

            readField(tag, result, this);

            if (this.pos === startPos) this.skip(val);
        }
        return result;
    },

    readMessage: function(readField, result) {
        return this.readFields(readField, result, this.readVarint() + this.pos);
    },

    readFixed32: function() {
        var val = this.buf.readUInt32LE(this.pos);
        this.pos += 4;
        return val;
    },

    readSFixed32: function() {
        var val = this.buf.readInt32LE(this.pos);
        this.pos += 4;
        return val;
    },

    // 64-bit int handling is based on github.com/dpw/node-buffer-more-ints (MIT-licensed)

    readFixed64: function() {
        var val = this.buf.readUInt32LE(this.pos) + this.buf.readUInt32LE(this.pos + 4) * SHIFT_LEFT_32;
        this.pos += 8;
        return val;
    },

    readSFixed64: function() {
        var val = this.buf.readUInt32LE(this.pos) + this.buf.readInt32LE(this.pos + 4) * SHIFT_LEFT_32;
        this.pos += 8;
        return val;
    },

    readFloat: function() {
        var val = this.buf.readFloatLE(this.pos);
        this.pos += 4;
        return val;
    },

    readDouble: function() {
        var val = this.buf.readDoubleLE(this.pos);
        this.pos += 8;
        return val;
    },

    readVarint: function() {
        var buf = this.buf,
            val, b;

        b = buf[this.pos++]; val  =  b & 0x7f;        if (b < 0x80) return val;
        b = buf[this.pos++]; val |= (b & 0x7f) << 7;  if (b < 0x80) return val;
        b = buf[this.pos++]; val |= (b & 0x7f) << 14; if (b < 0x80) return val;
        b = buf[this.pos++]; val |= (b & 0x7f) << 21; if (b < 0x80) return val;

        return readVarintRemainder(val, this);
    },

    readVarint64: function() {
        var startPos = this.pos,
            val = this.readVarint();

        if (val < POW_2_63) return val;

        var pos = this.pos - 2;
        while (this.buf[pos] === 0xff) pos--;
        if (pos < startPos) pos = startPos;

        val = 0;
        for (var i = 0; i < pos - startPos + 1; i++) {
            var b = ~this.buf[startPos + i] & 0x7f;
            val += i < 4 ? b << i * 7 : b * Math.pow(2, i * 7);
        }

        return -val - 1;
    },

    readSVarint: function() {
        var num = this.readVarint();
        return num % 2 === 1 ? (num + 1) / -2 : num / 2; // zigzag encoding
    },

    readBoolean: function() {
        return Boolean(this.readVarint());
    },

    readString: function() {
        var end = this.readVarint() + this.pos,
            str = this.buf.toString('utf8', this.pos, end);
        this.pos = end;
        return str;
    },

    readBytes: function() {
        var end = this.readVarint() + this.pos,
            buffer = this.buf.slice(this.pos, end);
        this.pos = end;
        return buffer;
    },

    // verbose for performance reasons; doesn't affect gzipped size

    readPackedVarint: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readVarint());
        return arr;
    },
    readPackedSVarint: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readSVarint());
        return arr;
    },
    readPackedBoolean: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readBoolean());
        return arr;
    },
    readPackedFloat: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readFloat());
        return arr;
    },
    readPackedDouble: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readDouble());
        return arr;
    },
    readPackedFixed32: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readFixed32());
        return arr;
    },
    readPackedSFixed32: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readSFixed32());
        return arr;
    },
    readPackedFixed64: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readFixed64());
        return arr;
    },
    readPackedSFixed64: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readSFixed64());
        return arr;
    },

    skip: function(val) {
        var type = val & 0x7;
        if (type === Pbf.Varint) while (this.buf[this.pos++] > 0x7f) {}
        else if (type === Pbf.Bytes) this.pos = this.readVarint() + this.pos;
        else if (type === Pbf.Fixed32) this.pos += 4;
        else if (type === Pbf.Fixed64) this.pos += 8;
        else throw new Error('Unimplemented type: ' + type);
    },

    // === WRITING =================================================================

    writeTag: function(tag, type) {
        this.writeVarint((tag << 3) | type);
    },

    realloc: function(min) {
        var length = this.length || 16;

        while (length < this.pos + min) length *= 2;

        if (length !== this.length) {
            var buf = new Buffer(length);
            this.buf.copy(buf);
            this.buf = buf;
            this.length = length;
        }
    },

    finish: function() {
        this.length = this.pos;
        this.pos = 0;
        return this.buf.slice(0, this.length);
    },

    writeFixed32: function(val) {
        this.realloc(4);
        this.buf.writeUInt32LE(val, this.pos);
        this.pos += 4;
    },

    writeSFixed32: function(val) {
        this.realloc(4);
        this.buf.writeInt32LE(val, this.pos);
        this.pos += 4;
    },

    writeFixed64: function(val) {
        this.realloc(8);
        this.buf.writeInt32LE(val & -1, this.pos);
        this.buf.writeUInt32LE(Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
        this.pos += 8;
    },

    writeSFixed64: function(val) {
        this.realloc(8);
        this.buf.writeInt32LE(val & -1, this.pos);
        this.buf.writeInt32LE(Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
        this.pos += 8;
    },

    writeVarint: function(val) {
        val = +val;

        if (val > 0xfffffff) {
            writeBigVarint(val, this);
            return;
        }

        this.realloc(4);

        this.buf[this.pos++] =           val & 0x7f  | (val > 0x7f ? 0x80 : 0); if (val < 0x7f) return;
        this.buf[this.pos++] = ((val >>>= 7) & 0x7f) | (val > 0x7f ? 0x80 : 0); if (val < 0x7f) return;
        this.buf[this.pos++] = ((val >>>= 7) & 0x7f) | (val > 0x7f ? 0x80 : 0); if (val < 0x7f) return;
        this.buf[this.pos++] =   (val >>> 7) & 0x7f;
    },

    writeSVarint: function(val) {
        this.writeVarint(val < 0 ? -val * 2 - 1 : val * 2);
    },

    writeBoolean: function(val) {
        this.writeVarint(Boolean(val));
    },

    writeString: function(str) {
        str = String(str);
        var bytes = Buffer.byteLength(str);
        this.writeVarint(bytes);
        this.realloc(bytes);
        this.buf.write(str, this.pos);
        this.pos += bytes;
    },

    writeFloat: function(val) {
        this.realloc(4);
        this.buf.writeFloatLE(val, this.pos);
        this.pos += 4;
    },

    writeDouble: function(val) {
        this.realloc(8);
        this.buf.writeDoubleLE(val, this.pos);
        this.pos += 8;
    },

    writeBytes: function(buffer) {
        var len = buffer.length;
        this.writeVarint(len);
        this.realloc(len);
        for (var i = 0; i < len; i++) this.buf[this.pos++] = buffer[i];
    },

    writeRawMessage: function(fn, obj) {
        this.pos++; // reserve 1 byte for short message length

        // write the message directly to the buffer and see how much was written
        var startPos = this.pos;
        fn(obj, this);
        var len = this.pos - startPos;

        if (len >= 0x80) reallocForRawMessage(startPos, len, this);

        // finally, write the message length in the reserved place and restore the position
        this.pos = startPos - 1;
        this.writeVarint(len);
        this.pos += len;
    },

    writeMessage: function(tag, fn, obj) {
        this.writeTag(tag, Pbf.Bytes);
        this.writeRawMessage(fn, obj);
    },

    writePackedVarint:   function(tag, arr) { this.writeMessage(tag, writePackedVarint, arr);   },
    writePackedSVarint:  function(tag, arr) { this.writeMessage(tag, writePackedSVarint, arr);  },
    writePackedBoolean:  function(tag, arr) { this.writeMessage(tag, writePackedBoolean, arr);  },
    writePackedFloat:    function(tag, arr) { this.writeMessage(tag, writePackedFloat, arr);    },
    writePackedDouble:   function(tag, arr) { this.writeMessage(tag, writePackedDouble, arr);   },
    writePackedFixed32:  function(tag, arr) { this.writeMessage(tag, writePackedFixed32, arr);  },
    writePackedSFixed32: function(tag, arr) { this.writeMessage(tag, writePackedSFixed32, arr); },
    writePackedFixed64:  function(tag, arr) { this.writeMessage(tag, writePackedFixed64, arr);  },
    writePackedSFixed64: function(tag, arr) { this.writeMessage(tag, writePackedSFixed64, arr); },

    writeBytesField: function(tag, buffer) {
        this.writeTag(tag, Pbf.Bytes);
        this.writeBytes(buffer);
    },
    writeFixed32Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed32);
        this.writeFixed32(val);
    },
    writeSFixed32Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed32);
        this.writeSFixed32(val);
    },
    writeFixed64Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed64);
        this.writeFixed64(val);
    },
    writeSFixed64Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed64);
        this.writeSFixed64(val);
    },
    writeVarintField: function(tag, val) {
        this.writeTag(tag, Pbf.Varint);
        this.writeVarint(val);
    },
    writeSVarintField: function(tag, val) {
        this.writeTag(tag, Pbf.Varint);
        this.writeSVarint(val);
    },
    writeStringField: function(tag, str) {
        this.writeTag(tag, Pbf.Bytes);
        this.writeString(str);
    },
    writeFloatField: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed32);
        this.writeFloat(val);
    },
    writeDoubleField: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed64);
        this.writeDouble(val);
    },
    writeBooleanField: function(tag, val) {
        this.writeVarintField(tag, Boolean(val));
    }
};

function readVarintRemainder(val, pbf) {
    var buf = pbf.buf, b;

    b = buf[pbf.pos++]; val += (b & 0x7f) * 0x10000000;         if (b < 0x80) return val;
    b = buf[pbf.pos++]; val += (b & 0x7f) * 0x800000000;        if (b < 0x80) return val;
    b = buf[pbf.pos++]; val += (b & 0x7f) * 0x40000000000;      if (b < 0x80) return val;
    b = buf[pbf.pos++]; val += (b & 0x7f) * 0x2000000000000;    if (b < 0x80) return val;
    b = buf[pbf.pos++]; val += (b & 0x7f) * 0x100000000000000;  if (b < 0x80) return val;
    b = buf[pbf.pos++]; val += (b & 0x7f) * 0x8000000000000000; if (b < 0x80) return val;

    throw new Error('Expected varint not more than 10 bytes');
}

function writeBigVarint(val, pbf) {
    pbf.realloc(10);

    var maxPos = pbf.pos + 10;

    while (val >= 1) {
        if (pbf.pos >= maxPos) throw new Error('Given varint doesn\'t fit into 10 bytes');
        var b = val & 0xff;
        pbf.buf[pbf.pos++] = b | (val >= 0x80 ? 0x80 : 0);
        val /= 0x80;
    }
}

function reallocForRawMessage(startPos, len, pbf) {
    var extraLen =
        len <= 0x3fff ? 1 :
        len <= 0x1fffff ? 2 :
        len <= 0xfffffff ? 3 : Math.ceil(Math.log(len) / (Math.LN2 * 7));

    // if 1 byte isn't enough for encoding message length, shift the data to the right
    pbf.realloc(extraLen);
    for (var i = pbf.pos - 1; i >= startPos; i--) pbf.buf[i + extraLen] = pbf.buf[i];
}

function writePackedVarint(arr, pbf)   { for (var i = 0; i < arr.length; i++) pbf.writeVarint(arr[i]);   }
function writePackedSVarint(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeSVarint(arr[i]);  }
function writePackedFloat(arr, pbf)    { for (var i = 0; i < arr.length; i++) pbf.writeFloat(arr[i]);    }
function writePackedDouble(arr, pbf)   { for (var i = 0; i < arr.length; i++) pbf.writeDouble(arr[i]);   }
function writePackedBoolean(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeBoolean(arr[i]);  }
function writePackedFixed32(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeFixed32(arr[i]);  }
function writePackedSFixed32(arr, pbf) { for (var i = 0; i < arr.length; i++) pbf.writeSFixed32(arr[i]); }
function writePackedFixed64(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeFixed64(arr[i]);  }
function writePackedSFixed64(arr, pbf) { for (var i = 0; i < arr.length; i++) pbf.writeSFixed64(arr[i]); }

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./buffer":1}],3:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWZmZXIuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQy9KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBsaWdodHdlaWdodCBCdWZmZXIgc2hpbSBmb3IgcGJmIGJyb3dzZXIgYnVpbGRcbi8vIGJhc2VkIG9uIGNvZGUgZnJvbSBnaXRodWIuY29tL2Zlcm9zcy9idWZmZXIgKE1JVC1saWNlbnNlZClcblxubW9kdWxlLmV4cG9ydHMgPSBCdWZmZXI7XG5cbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpO1xuXG52YXIgQnVmZmVyTWV0aG9kcztcblxuZnVuY3Rpb24gQnVmZmVyKGxlbmd0aCkge1xuICAgIHZhciBhcnI7XG4gICAgaWYgKGxlbmd0aCAmJiBsZW5ndGgubGVuZ3RoKSB7XG4gICAgICAgIGFyciA9IGxlbmd0aDtcbiAgICAgICAgbGVuZ3RoID0gYXJyLmxlbmd0aDtcbiAgICB9XG4gICAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCB8fCAwKTtcbiAgICBpZiAoYXJyKSBidWYuc2V0KGFycik7XG5cbiAgICBidWYucmVhZFVJbnQzMkxFID0gQnVmZmVyTWV0aG9kcy5yZWFkVUludDMyTEU7XG4gICAgYnVmLndyaXRlVUludDMyTEUgPSBCdWZmZXJNZXRob2RzLndyaXRlVUludDMyTEU7XG4gICAgYnVmLnJlYWRJbnQzMkxFID0gQnVmZmVyTWV0aG9kcy5yZWFkSW50MzJMRTtcbiAgICBidWYud3JpdGVJbnQzMkxFID0gQnVmZmVyTWV0aG9kcy53cml0ZUludDMyTEU7XG4gICAgYnVmLnJlYWRGbG9hdExFID0gQnVmZmVyTWV0aG9kcy5yZWFkRmxvYXRMRTtcbiAgICBidWYud3JpdGVGbG9hdExFID0gQnVmZmVyTWV0aG9kcy53cml0ZUZsb2F0TEU7XG4gICAgYnVmLnJlYWREb3VibGVMRSA9IEJ1ZmZlck1ldGhvZHMucmVhZERvdWJsZUxFO1xuICAgIGJ1Zi53cml0ZURvdWJsZUxFID0gQnVmZmVyTWV0aG9kcy53cml0ZURvdWJsZUxFO1xuICAgIGJ1Zi50b1N0cmluZyA9IEJ1ZmZlck1ldGhvZHMudG9TdHJpbmc7XG4gICAgYnVmLndyaXRlID0gQnVmZmVyTWV0aG9kcy53cml0ZTtcbiAgICBidWYuc2xpY2UgPSBCdWZmZXJNZXRob2RzLnNsaWNlO1xuICAgIGJ1Zi5jb3B5ID0gQnVmZmVyTWV0aG9kcy5jb3B5O1xuXG4gICAgYnVmLl9pc0J1ZmZlciA9IHRydWU7XG4gICAgcmV0dXJuIGJ1Zjtcbn1cblxudmFyIGxhc3RTdHIsIGxhc3RTdHJFbmNvZGVkO1xuXG5CdWZmZXJNZXRob2RzID0ge1xuICAgIHJlYWRVSW50MzJMRTogZnVuY3Rpb24ocG9zKSB7XG4gICAgICAgIHJldHVybiAoKHRoaXNbcG9zXSkgfFxuICAgICAgICAgICAgKHRoaXNbcG9zICsgMV0gPDwgOCkgfFxuICAgICAgICAgICAgKHRoaXNbcG9zICsgMl0gPDwgMTYpKSArXG4gICAgICAgICAgICAodGhpc1twb3MgKyAzXSAqIDB4MTAwMDAwMCk7XG4gICAgfSxcblxuICAgIHdyaXRlVUludDMyTEU6IGZ1bmN0aW9uKHZhbCwgcG9zKSB7XG4gICAgICAgIHRoaXNbcG9zXSA9IHZhbDtcbiAgICAgICAgdGhpc1twb3MgKyAxXSA9ICh2YWwgPj4+IDgpO1xuICAgICAgICB0aGlzW3BvcyArIDJdID0gKHZhbCA+Pj4gMTYpO1xuICAgICAgICB0aGlzW3BvcyArIDNdID0gKHZhbCA+Pj4gMjQpO1xuICAgIH0sXG5cbiAgICByZWFkSW50MzJMRTogZnVuY3Rpb24ocG9zKSB7XG4gICAgICAgIHJldHVybiAoKHRoaXNbcG9zXSkgfFxuICAgICAgICAgICAgKHRoaXNbcG9zICsgMV0gPDwgOCkgfFxuICAgICAgICAgICAgKHRoaXNbcG9zICsgMl0gPDwgMTYpKSArXG4gICAgICAgICAgICAodGhpc1twb3MgKyAzXSA8PCAyNCk7XG4gICAgfSxcblxuICAgIHJlYWRGbG9hdExFOiAgZnVuY3Rpb24ocG9zKSB7IHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgcG9zLCB0cnVlLCAyMywgNCk7IH0sXG4gICAgcmVhZERvdWJsZUxFOiBmdW5jdGlvbihwb3MpIHsgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBwb3MsIHRydWUsIDUyLCA4KTsgfSxcblxuICAgIHdyaXRlRmxvYXRMRTogIGZ1bmN0aW9uKHZhbCwgcG9zKSB7IHJldHVybiBpZWVlNzU0LndyaXRlKHRoaXMsIHZhbCwgcG9zLCB0cnVlLCAyMywgNCk7IH0sXG4gICAgd3JpdGVEb3VibGVMRTogZnVuY3Rpb24odmFsLCBwb3MpIHsgcmV0dXJuIGllZWU3NTQud3JpdGUodGhpcywgdmFsLCBwb3MsIHRydWUsIDUyLCA4KTsgfSxcblxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbihlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICAgICAgICB2YXIgc3RyID0gJycsXG4gICAgICAgICAgICB0bXAgPSAnJztcblxuICAgICAgICBzdGFydCA9IHN0YXJ0IHx8IDA7XG4gICAgICAgIGVuZCA9IE1hdGgubWluKHRoaXMubGVuZ3RoLCBlbmQgfHwgdGhpcy5sZW5ndGgpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2ggPSB0aGlzW2ldO1xuICAgICAgICAgICAgaWYgKGNoIDw9IDB4N0YpIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gZGVjb2RlVVJJQ29tcG9uZW50KHRtcCkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGNoKTtcbiAgICAgICAgICAgICAgICB0bXAgPSAnJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdG1wICs9ICclJyArIGNoLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHN0ciArPSBkZWNvZGVVUklDb21wb25lbnQodG1wKTtcblxuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH0sXG5cbiAgICB3cml0ZTogZnVuY3Rpb24oc3RyLCBwb3MpIHtcbiAgICAgICAgdmFyIGJ5dGVzID0gc3RyID09PSBsYXN0U3RyID8gbGFzdFN0ckVuY29kZWQgOiBlbmNvZGVTdHJpbmcoc3RyKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpc1twb3MgKyBpXSA9IGJ5dGVzW2ldO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNsaWNlOiBmdW5jdGlvbihzdGFydCwgZW5kKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpO1xuICAgIH0sXG5cbiAgICBjb3B5OiBmdW5jdGlvbihidWYsIHBvcykge1xuICAgICAgICBwb3MgPSBwb3MgfHwgMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBidWZbcG9zICsgaV0gPSB0aGlzW2ldO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuQnVmZmVyTWV0aG9kcy53cml0ZUludDMyTEUgPSBCdWZmZXJNZXRob2RzLndyaXRlVUludDMyTEU7XG5cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgbGFzdFN0ciA9IHN0cjtcbiAgICBsYXN0U3RyRW5jb2RlZCA9IGVuY29kZVN0cmluZyhzdHIpO1xuICAgIHJldHVybiBsYXN0U3RyRW5jb2RlZC5sZW5ndGg7XG59O1xuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbihidWYpIHtcbiAgICByZXR1cm4gISEoYnVmICYmIGJ1Zi5faXNCdWZmZXIpO1xufTtcblxuZnVuY3Rpb24gZW5jb2RlU3RyaW5nKHN0cikge1xuICAgIHZhciBsZW5ndGggPSBzdHIubGVuZ3RoLFxuICAgICAgICBieXRlcyA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGMsIGxlYWQ7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSk7IC8vIGNvZGUgcG9pbnRcblxuICAgICAgICBpZiAoYyA+IDB4RDdGRiAmJiBjIDwgMHhFMDAwKSB7XG5cbiAgICAgICAgICAgIGlmIChsZWFkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGMgPCAweERDMDApIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKTtcbiAgICAgICAgICAgICAgICAgICAgbGVhZCA9IGM7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYyA9IGxlYWQgLSAweEQ4MDAgPDwgMTAgfCBjIC0gMHhEQzAwIHwgMHgxMDAwMDtcbiAgICAgICAgICAgICAgICAgICAgbGVhZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChjID4gMHhEQkZGIHx8IChpICsgMSA9PT0gbGVuZ3RoKSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKTtcbiAgICAgICAgICAgICAgICBlbHNlIGxlYWQgPSBjO1xuXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIGlmIChsZWFkKSB7XG4gICAgICAgICAgICBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpO1xuICAgICAgICAgICAgbGVhZCA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYyA8IDB4ODApIGJ5dGVzLnB1c2goYyk7XG4gICAgICAgIGVsc2UgaWYgKGMgPCAweDgwMCkgYnl0ZXMucHVzaChjID4+IDB4NiB8IDB4QzAsIGMgJiAweDNGIHwgMHg4MCk7XG4gICAgICAgIGVsc2UgaWYgKGMgPCAweDEwMDAwKSBieXRlcy5wdXNoKGMgPj4gMHhDIHwgMHhFMCwgYyA+PiAweDYgJiAweDNGIHwgMHg4MCwgYyAmIDB4M0YgfCAweDgwKTtcbiAgICAgICAgZWxzZSBieXRlcy5wdXNoKGMgPj4gMHgxMiB8IDB4RjAsIGMgPj4gMHhDICYgMHgzRiB8IDB4ODAsIGMgPj4gMHg2ICYgMHgzRiB8IDB4ODAsIGMgJiAweDNGIHwgMHg4MCk7XG4gICAgfVxuICAgIHJldHVybiBieXRlcztcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBQYmY7XG5cbnZhciBCdWZmZXIgPSBnbG9iYWwuQnVmZmVyIHx8IHJlcXVpcmUoJy4vYnVmZmVyJyk7XG5cbmZ1bmN0aW9uIFBiZihidWYpIHtcbiAgICB0aGlzLmJ1ZiA9ICFCdWZmZXIuaXNCdWZmZXIoYnVmKSA/IG5ldyBCdWZmZXIoYnVmIHx8IDApIDogYnVmO1xuICAgIHRoaXMucG9zID0gMDtcbiAgICB0aGlzLmxlbmd0aCA9IHRoaXMuYnVmLmxlbmd0aDtcbn1cblxuUGJmLlZhcmludCAgPSAwOyAvLyB2YXJpbnQ6IGludDMyLCBpbnQ2NCwgdWludDMyLCB1aW50NjQsIHNpbnQzMiwgc2ludDY0LCBib29sLCBlbnVtXG5QYmYuRml4ZWQ2NCA9IDE7IC8vIDY0LWJpdDogZG91YmxlLCBmaXhlZDY0LCBzZml4ZWQ2NFxuUGJmLkJ5dGVzICAgPSAyOyAvLyBsZW5ndGgtZGVsaW1pdGVkOiBzdHJpbmcsIGJ5dGVzLCBlbWJlZGRlZCBtZXNzYWdlcywgcGFja2VkIHJlcGVhdGVkIGZpZWxkc1xuUGJmLkZpeGVkMzIgPSA1OyAvLyAzMi1iaXQ6IGZsb2F0LCBmaXhlZDMyLCBzZml4ZWQzMlxuXG52YXIgU0hJRlRfTEVGVF8zMiA9ICgxIDw8IDE2KSAqICgxIDw8IDE2KSxcbiAgICBTSElGVF9SSUdIVF8zMiA9IDEgLyBTSElGVF9MRUZUXzMyLFxuICAgIFBPV18yXzYzID0gTWF0aC5wb3coMiwgNjMpO1xuXG5QYmYucHJvdG90eXBlID0ge1xuXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuYnVmID0gbnVsbDtcbiAgICB9LFxuXG4gICAgLy8gPT09IFJFQURJTkcgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIHJlYWRGaWVsZHM6IGZ1bmN0aW9uKHJlYWRGaWVsZCwgcmVzdWx0LCBlbmQpIHtcbiAgICAgICAgZW5kID0gZW5kIHx8IHRoaXMubGVuZ3RoO1xuXG4gICAgICAgIHdoaWxlICh0aGlzLnBvcyA8IGVuZCkge1xuICAgICAgICAgICAgdmFyIHZhbCA9IHRoaXMucmVhZFZhcmludCgpLFxuICAgICAgICAgICAgICAgIHRhZyA9IHZhbCA+PiAzLFxuICAgICAgICAgICAgICAgIHN0YXJ0UG9zID0gdGhpcy5wb3M7XG5cbiAgICAgICAgICAgIHJlYWRGaWVsZCh0YWcsIHJlc3VsdCwgdGhpcyk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnBvcyA9PT0gc3RhcnRQb3MpIHRoaXMuc2tpcCh2YWwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIHJlYWRNZXNzYWdlOiBmdW5jdGlvbihyZWFkRmllbGQsIHJlc3VsdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkRmllbGRzKHJlYWRGaWVsZCwgcmVzdWx0LCB0aGlzLnJlYWRWYXJpbnQoKSArIHRoaXMucG9zKTtcbiAgICB9LFxuXG4gICAgcmVhZEZpeGVkMzI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsID0gdGhpcy5idWYucmVhZFVJbnQzMkxFKHRoaXMucG9zKTtcbiAgICAgICAgdGhpcy5wb3MgKz0gNDtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LFxuXG4gICAgcmVhZFNGaXhlZDMyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbCA9IHRoaXMuYnVmLnJlYWRJbnQzMkxFKHRoaXMucG9zKTtcbiAgICAgICAgdGhpcy5wb3MgKz0gNDtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LFxuXG4gICAgLy8gNjQtYml0IGludCBoYW5kbGluZyBpcyBiYXNlZCBvbiBnaXRodWIuY29tL2Rwdy9ub2RlLWJ1ZmZlci1tb3JlLWludHMgKE1JVC1saWNlbnNlZClcblxuICAgIHJlYWRGaXhlZDY0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbCA9IHRoaXMuYnVmLnJlYWRVSW50MzJMRSh0aGlzLnBvcykgKyB0aGlzLmJ1Zi5yZWFkVUludDMyTEUodGhpcy5wb3MgKyA0KSAqIFNISUZUX0xFRlRfMzI7XG4gICAgICAgIHRoaXMucG9zICs9IDg7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIHJlYWRTRml4ZWQ2NDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2YWwgPSB0aGlzLmJ1Zi5yZWFkVUludDMyTEUodGhpcy5wb3MpICsgdGhpcy5idWYucmVhZEludDMyTEUodGhpcy5wb3MgKyA0KSAqIFNISUZUX0xFRlRfMzI7XG4gICAgICAgIHRoaXMucG9zICs9IDg7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIHJlYWRGbG9hdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2YWwgPSB0aGlzLmJ1Zi5yZWFkRmxvYXRMRSh0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMucG9zICs9IDQ7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIHJlYWREb3VibGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsID0gdGhpcy5idWYucmVhZERvdWJsZUxFKHRoaXMucG9zKTtcbiAgICAgICAgdGhpcy5wb3MgKz0gODtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LFxuXG4gICAgcmVhZFZhcmludDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBidWYgPSB0aGlzLmJ1ZixcbiAgICAgICAgICAgIHZhbCwgYjtcblxuICAgICAgICBiID0gYnVmW3RoaXMucG9zKytdOyB2YWwgID0gIGIgJiAweDdmOyAgICAgICAgaWYgKGIgPCAweDgwKSByZXR1cm4gdmFsO1xuICAgICAgICBiID0gYnVmW3RoaXMucG9zKytdOyB2YWwgfD0gKGIgJiAweDdmKSA8PCA3OyAgaWYgKGIgPCAweDgwKSByZXR1cm4gdmFsO1xuICAgICAgICBiID0gYnVmW3RoaXMucG9zKytdOyB2YWwgfD0gKGIgJiAweDdmKSA8PCAxNDsgaWYgKGIgPCAweDgwKSByZXR1cm4gdmFsO1xuICAgICAgICBiID0gYnVmW3RoaXMucG9zKytdOyB2YWwgfD0gKGIgJiAweDdmKSA8PCAyMTsgaWYgKGIgPCAweDgwKSByZXR1cm4gdmFsO1xuXG4gICAgICAgIHJldHVybiByZWFkVmFyaW50UmVtYWluZGVyKHZhbCwgdGhpcyk7XG4gICAgfSxcblxuICAgIHJlYWRWYXJpbnQ2NDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdGFydFBvcyA9IHRoaXMucG9zLFxuICAgICAgICAgICAgdmFsID0gdGhpcy5yZWFkVmFyaW50KCk7XG5cbiAgICAgICAgaWYgKHZhbCA8IFBPV18yXzYzKSByZXR1cm4gdmFsO1xuXG4gICAgICAgIHZhciBwb3MgPSB0aGlzLnBvcyAtIDI7XG4gICAgICAgIHdoaWxlICh0aGlzLmJ1Zltwb3NdID09PSAweGZmKSBwb3MtLTtcbiAgICAgICAgaWYgKHBvcyA8IHN0YXJ0UG9zKSBwb3MgPSBzdGFydFBvcztcblxuICAgICAgICB2YWwgPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvcyAtIHN0YXJ0UG9zICsgMTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYiA9IH50aGlzLmJ1ZltzdGFydFBvcyArIGldICYgMHg3ZjtcbiAgICAgICAgICAgIHZhbCArPSBpIDwgNCA/IGIgPDwgaSAqIDcgOiBiICogTWF0aC5wb3coMiwgaSAqIDcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIC12YWwgLSAxO1xuICAgIH0sXG5cbiAgICByZWFkU1ZhcmludDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBudW0gPSB0aGlzLnJlYWRWYXJpbnQoKTtcbiAgICAgICAgcmV0dXJuIG51bSAlIDIgPT09IDEgPyAobnVtICsgMSkgLyAtMiA6IG51bSAvIDI7IC8vIHppZ3phZyBlbmNvZGluZ1xuICAgIH0sXG5cbiAgICByZWFkQm9vbGVhbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBCb29sZWFuKHRoaXMucmVhZFZhcmludCgpKTtcbiAgICB9LFxuXG4gICAgcmVhZFN0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbmQgPSB0aGlzLnJlYWRWYXJpbnQoKSArIHRoaXMucG9zLFxuICAgICAgICAgICAgc3RyID0gdGhpcy5idWYudG9TdHJpbmcoJ3V0ZjgnLCB0aGlzLnBvcywgZW5kKTtcbiAgICAgICAgdGhpcy5wb3MgPSBlbmQ7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfSxcblxuICAgIHJlYWRCeXRlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbmQgPSB0aGlzLnJlYWRWYXJpbnQoKSArIHRoaXMucG9zLFxuICAgICAgICAgICAgYnVmZmVyID0gdGhpcy5idWYuc2xpY2UodGhpcy5wb3MsIGVuZCk7XG4gICAgICAgIHRoaXMucG9zID0gZW5kO1xuICAgICAgICByZXR1cm4gYnVmZmVyO1xuICAgIH0sXG5cbiAgICAvLyB2ZXJib3NlIGZvciBwZXJmb3JtYW5jZSByZWFzb25zOyBkb2Vzbid0IGFmZmVjdCBnemlwcGVkIHNpemVcblxuICAgIHJlYWRQYWNrZWRWYXJpbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZW5kID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcywgYXJyID0gW107XG4gICAgICAgIHdoaWxlICh0aGlzLnBvcyA8IGVuZCkgYXJyLnB1c2godGhpcy5yZWFkVmFyaW50KCkpO1xuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH0sXG4gICAgcmVhZFBhY2tlZFNWYXJpbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZW5kID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcywgYXJyID0gW107XG4gICAgICAgIHdoaWxlICh0aGlzLnBvcyA8IGVuZCkgYXJyLnB1c2godGhpcy5yZWFkU1ZhcmludCgpKTtcbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9LFxuICAgIHJlYWRQYWNrZWRCb29sZWFuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVuZCA9IHRoaXMucmVhZFZhcmludCgpICsgdGhpcy5wb3MsIGFyciA9IFtdO1xuICAgICAgICB3aGlsZSAodGhpcy5wb3MgPCBlbmQpIGFyci5wdXNoKHRoaXMucmVhZEJvb2xlYW4oKSk7XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcbiAgICByZWFkUGFja2VkRmxvYXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZW5kID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcywgYXJyID0gW107XG4gICAgICAgIHdoaWxlICh0aGlzLnBvcyA8IGVuZCkgYXJyLnB1c2godGhpcy5yZWFkRmxvYXQoKSk7XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcbiAgICByZWFkUGFja2VkRG91YmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVuZCA9IHRoaXMucmVhZFZhcmludCgpICsgdGhpcy5wb3MsIGFyciA9IFtdO1xuICAgICAgICB3aGlsZSAodGhpcy5wb3MgPCBlbmQpIGFyci5wdXNoKHRoaXMucmVhZERvdWJsZSgpKTtcbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9LFxuICAgIHJlYWRQYWNrZWRGaXhlZDMyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVuZCA9IHRoaXMucmVhZFZhcmludCgpICsgdGhpcy5wb3MsIGFyciA9IFtdO1xuICAgICAgICB3aGlsZSAodGhpcy5wb3MgPCBlbmQpIGFyci5wdXNoKHRoaXMucmVhZEZpeGVkMzIoKSk7XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcbiAgICByZWFkUGFja2VkU0ZpeGVkMzI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZW5kID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcywgYXJyID0gW107XG4gICAgICAgIHdoaWxlICh0aGlzLnBvcyA8IGVuZCkgYXJyLnB1c2godGhpcy5yZWFkU0ZpeGVkMzIoKSk7XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcbiAgICByZWFkUGFja2VkRml4ZWQ2NDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbmQgPSB0aGlzLnJlYWRWYXJpbnQoKSArIHRoaXMucG9zLCBhcnIgPSBbXTtcbiAgICAgICAgd2hpbGUgKHRoaXMucG9zIDwgZW5kKSBhcnIucHVzaCh0aGlzLnJlYWRGaXhlZDY0KCkpO1xuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH0sXG4gICAgcmVhZFBhY2tlZFNGaXhlZDY0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVuZCA9IHRoaXMucmVhZFZhcmludCgpICsgdGhpcy5wb3MsIGFyciA9IFtdO1xuICAgICAgICB3aGlsZSAodGhpcy5wb3MgPCBlbmQpIGFyci5wdXNoKHRoaXMucmVhZFNGaXhlZDY0KCkpO1xuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH0sXG5cbiAgICBza2lwOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdmFyIHR5cGUgPSB2YWwgJiAweDc7XG4gICAgICAgIGlmICh0eXBlID09PSBQYmYuVmFyaW50KSB3aGlsZSAodGhpcy5idWZbdGhpcy5wb3MrK10gPiAweDdmKSB7fVxuICAgICAgICBlbHNlIGlmICh0eXBlID09PSBQYmYuQnl0ZXMpIHRoaXMucG9zID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcztcbiAgICAgICAgZWxzZSBpZiAodHlwZSA9PT0gUGJmLkZpeGVkMzIpIHRoaXMucG9zICs9IDQ7XG4gICAgICAgIGVsc2UgaWYgKHR5cGUgPT09IFBiZi5GaXhlZDY0KSB0aGlzLnBvcyArPSA4O1xuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcignVW5pbXBsZW1lbnRlZCB0eXBlOiAnICsgdHlwZSk7XG4gICAgfSxcblxuICAgIC8vID09PSBXUklUSU5HID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICB3cml0ZVRhZzogZnVuY3Rpb24odGFnLCB0eXBlKSB7XG4gICAgICAgIHRoaXMud3JpdGVWYXJpbnQoKHRhZyA8PCAzKSB8IHR5cGUpO1xuICAgIH0sXG5cbiAgICByZWFsbG9jOiBmdW5jdGlvbihtaW4pIHtcbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoIHx8IDE2O1xuXG4gICAgICAgIHdoaWxlIChsZW5ndGggPCB0aGlzLnBvcyArIG1pbikgbGVuZ3RoICo9IDI7XG5cbiAgICAgICAgaWYgKGxlbmd0aCAhPT0gdGhpcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBidWYgPSBuZXcgQnVmZmVyKGxlbmd0aCk7XG4gICAgICAgICAgICB0aGlzLmJ1Zi5jb3B5KGJ1Zik7XG4gICAgICAgICAgICB0aGlzLmJ1ZiA9IGJ1ZjtcbiAgICAgICAgICAgIHRoaXMubGVuZ3RoID0gbGVuZ3RoO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGZpbmlzaDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5wb3M7XG4gICAgICAgIHRoaXMucG9zID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXMuYnVmLnNsaWNlKDAsIHRoaXMubGVuZ3RoKTtcbiAgICB9LFxuXG4gICAgd3JpdGVGaXhlZDMyOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdGhpcy5yZWFsbG9jKDQpO1xuICAgICAgICB0aGlzLmJ1Zi53cml0ZVVJbnQzMkxFKHZhbCwgdGhpcy5wb3MpO1xuICAgICAgICB0aGlzLnBvcyArPSA0O1xuICAgIH0sXG5cbiAgICB3cml0ZVNGaXhlZDMyOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdGhpcy5yZWFsbG9jKDQpO1xuICAgICAgICB0aGlzLmJ1Zi53cml0ZUludDMyTEUodmFsLCB0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMucG9zICs9IDQ7XG4gICAgfSxcblxuICAgIHdyaXRlRml4ZWQ2NDogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIHRoaXMucmVhbGxvYyg4KTtcbiAgICAgICAgdGhpcy5idWYud3JpdGVJbnQzMkxFKHZhbCAmIC0xLCB0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMuYnVmLndyaXRlVUludDMyTEUoTWF0aC5mbG9vcih2YWwgKiBTSElGVF9SSUdIVF8zMiksIHRoaXMucG9zICsgNCk7XG4gICAgICAgIHRoaXMucG9zICs9IDg7XG4gICAgfSxcblxuICAgIHdyaXRlU0ZpeGVkNjQ6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICB0aGlzLnJlYWxsb2MoOCk7XG4gICAgICAgIHRoaXMuYnVmLndyaXRlSW50MzJMRSh2YWwgJiAtMSwgdGhpcy5wb3MpO1xuICAgICAgICB0aGlzLmJ1Zi53cml0ZUludDMyTEUoTWF0aC5mbG9vcih2YWwgKiBTSElGVF9SSUdIVF8zMiksIHRoaXMucG9zICsgNCk7XG4gICAgICAgIHRoaXMucG9zICs9IDg7XG4gICAgfSxcblxuICAgIHdyaXRlVmFyaW50OiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdmFsID0gK3ZhbDtcblxuICAgICAgICBpZiAodmFsID4gMHhmZmZmZmZmKSB7XG4gICAgICAgICAgICB3cml0ZUJpZ1ZhcmludCh2YWwsIHRoaXMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWFsbG9jKDQpO1xuXG4gICAgICAgIHRoaXMuYnVmW3RoaXMucG9zKytdID0gICAgICAgICAgIHZhbCAmIDB4N2YgIHwgKHZhbCA+IDB4N2YgPyAweDgwIDogMCk7IGlmICh2YWwgPCAweDdmKSByZXR1cm47XG4gICAgICAgIHRoaXMuYnVmW3RoaXMucG9zKytdID0gKCh2YWwgPj4+PSA3KSAmIDB4N2YpIHwgKHZhbCA+IDB4N2YgPyAweDgwIDogMCk7IGlmICh2YWwgPCAweDdmKSByZXR1cm47XG4gICAgICAgIHRoaXMuYnVmW3RoaXMucG9zKytdID0gKCh2YWwgPj4+PSA3KSAmIDB4N2YpIHwgKHZhbCA+IDB4N2YgPyAweDgwIDogMCk7IGlmICh2YWwgPCAweDdmKSByZXR1cm47XG4gICAgICAgIHRoaXMuYnVmW3RoaXMucG9zKytdID0gICAodmFsID4+PiA3KSAmIDB4N2Y7XG4gICAgfSxcblxuICAgIHdyaXRlU1ZhcmludDogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIHRoaXMud3JpdGVWYXJpbnQodmFsIDwgMCA/IC12YWwgKiAyIC0gMSA6IHZhbCAqIDIpO1xuICAgIH0sXG5cbiAgICB3cml0ZUJvb2xlYW46IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICB0aGlzLndyaXRlVmFyaW50KEJvb2xlYW4odmFsKSk7XG4gICAgfSxcblxuICAgIHdyaXRlU3RyaW5nOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgc3RyID0gU3RyaW5nKHN0cik7XG4gICAgICAgIHZhciBieXRlcyA9IEJ1ZmZlci5ieXRlTGVuZ3RoKHN0cik7XG4gICAgICAgIHRoaXMud3JpdGVWYXJpbnQoYnl0ZXMpO1xuICAgICAgICB0aGlzLnJlYWxsb2MoYnl0ZXMpO1xuICAgICAgICB0aGlzLmJ1Zi53cml0ZShzdHIsIHRoaXMucG9zKTtcbiAgICAgICAgdGhpcy5wb3MgKz0gYnl0ZXM7XG4gICAgfSxcblxuICAgIHdyaXRlRmxvYXQ6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICB0aGlzLnJlYWxsb2MoNCk7XG4gICAgICAgIHRoaXMuYnVmLndyaXRlRmxvYXRMRSh2YWwsIHRoaXMucG9zKTtcbiAgICAgICAgdGhpcy5wb3MgKz0gNDtcbiAgICB9LFxuXG4gICAgd3JpdGVEb3VibGU6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICB0aGlzLnJlYWxsb2MoOCk7XG4gICAgICAgIHRoaXMuYnVmLndyaXRlRG91YmxlTEUodmFsLCB0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMucG9zICs9IDg7XG4gICAgfSxcblxuICAgIHdyaXRlQnl0ZXM6IGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgICB2YXIgbGVuID0gYnVmZmVyLmxlbmd0aDtcbiAgICAgICAgdGhpcy53cml0ZVZhcmludChsZW4pO1xuICAgICAgICB0aGlzLnJlYWxsb2MobGVuKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykgdGhpcy5idWZbdGhpcy5wb3MrK10gPSBidWZmZXJbaV07XG4gICAgfSxcblxuICAgIHdyaXRlUmF3TWVzc2FnZTogZnVuY3Rpb24oZm4sIG9iaikge1xuICAgICAgICB0aGlzLnBvcysrOyAvLyByZXNlcnZlIDEgYnl0ZSBmb3Igc2hvcnQgbWVzc2FnZSBsZW5ndGhcblxuICAgICAgICAvLyB3cml0ZSB0aGUgbWVzc2FnZSBkaXJlY3RseSB0byB0aGUgYnVmZmVyIGFuZCBzZWUgaG93IG11Y2ggd2FzIHdyaXR0ZW5cbiAgICAgICAgdmFyIHN0YXJ0UG9zID0gdGhpcy5wb3M7XG4gICAgICAgIGZuKG9iaiwgdGhpcyk7XG4gICAgICAgIHZhciBsZW4gPSB0aGlzLnBvcyAtIHN0YXJ0UG9zO1xuXG4gICAgICAgIGlmIChsZW4gPj0gMHg4MCkgcmVhbGxvY0ZvclJhd01lc3NhZ2Uoc3RhcnRQb3MsIGxlbiwgdGhpcyk7XG5cbiAgICAgICAgLy8gZmluYWxseSwgd3JpdGUgdGhlIG1lc3NhZ2UgbGVuZ3RoIGluIHRoZSByZXNlcnZlZCBwbGFjZSBhbmQgcmVzdG9yZSB0aGUgcG9zaXRpb25cbiAgICAgICAgdGhpcy5wb3MgPSBzdGFydFBvcyAtIDE7XG4gICAgICAgIHRoaXMud3JpdGVWYXJpbnQobGVuKTtcbiAgICAgICAgdGhpcy5wb3MgKz0gbGVuO1xuICAgIH0sXG5cbiAgICB3cml0ZU1lc3NhZ2U6IGZ1bmN0aW9uKHRhZywgZm4sIG9iaikge1xuICAgICAgICB0aGlzLndyaXRlVGFnKHRhZywgUGJmLkJ5dGVzKTtcbiAgICAgICAgdGhpcy53cml0ZVJhd01lc3NhZ2UoZm4sIG9iaik7XG4gICAgfSxcblxuICAgIHdyaXRlUGFja2VkVmFyaW50OiAgIGZ1bmN0aW9uKHRhZywgYXJyKSB7IHRoaXMud3JpdGVNZXNzYWdlKHRhZywgd3JpdGVQYWNrZWRWYXJpbnQsIGFycik7ICAgfSxcbiAgICB3cml0ZVBhY2tlZFNWYXJpbnQ6ICBmdW5jdGlvbih0YWcsIGFycikgeyB0aGlzLndyaXRlTWVzc2FnZSh0YWcsIHdyaXRlUGFja2VkU1ZhcmludCwgYXJyKTsgIH0sXG4gICAgd3JpdGVQYWNrZWRCb29sZWFuOiAgZnVuY3Rpb24odGFnLCBhcnIpIHsgdGhpcy53cml0ZU1lc3NhZ2UodGFnLCB3cml0ZVBhY2tlZEJvb2xlYW4sIGFycik7ICB9LFxuICAgIHdyaXRlUGFja2VkRmxvYXQ6ICAgIGZ1bmN0aW9uKHRhZywgYXJyKSB7IHRoaXMud3JpdGVNZXNzYWdlKHRhZywgd3JpdGVQYWNrZWRGbG9hdCwgYXJyKTsgICAgfSxcbiAgICB3cml0ZVBhY2tlZERvdWJsZTogICBmdW5jdGlvbih0YWcsIGFycikgeyB0aGlzLndyaXRlTWVzc2FnZSh0YWcsIHdyaXRlUGFja2VkRG91YmxlLCBhcnIpOyAgIH0sXG4gICAgd3JpdGVQYWNrZWRGaXhlZDMyOiAgZnVuY3Rpb24odGFnLCBhcnIpIHsgdGhpcy53cml0ZU1lc3NhZ2UodGFnLCB3cml0ZVBhY2tlZEZpeGVkMzIsIGFycik7ICB9LFxuICAgIHdyaXRlUGFja2VkU0ZpeGVkMzI6IGZ1bmN0aW9uKHRhZywgYXJyKSB7IHRoaXMud3JpdGVNZXNzYWdlKHRhZywgd3JpdGVQYWNrZWRTRml4ZWQzMiwgYXJyKTsgfSxcbiAgICB3cml0ZVBhY2tlZEZpeGVkNjQ6ICBmdW5jdGlvbih0YWcsIGFycikgeyB0aGlzLndyaXRlTWVzc2FnZSh0YWcsIHdyaXRlUGFja2VkRml4ZWQ2NCwgYXJyKTsgIH0sXG4gICAgd3JpdGVQYWNrZWRTRml4ZWQ2NDogZnVuY3Rpb24odGFnLCBhcnIpIHsgdGhpcy53cml0ZU1lc3NhZ2UodGFnLCB3cml0ZVBhY2tlZFNGaXhlZDY0LCBhcnIpOyB9LFxuXG4gICAgd3JpdGVCeXRlc0ZpZWxkOiBmdW5jdGlvbih0YWcsIGJ1ZmZlcikge1xuICAgICAgICB0aGlzLndyaXRlVGFnKHRhZywgUGJmLkJ5dGVzKTtcbiAgICAgICAgdGhpcy53cml0ZUJ5dGVzKGJ1ZmZlcik7XG4gICAgfSxcbiAgICB3cml0ZUZpeGVkMzJGaWVsZDogZnVuY3Rpb24odGFnLCB2YWwpIHtcbiAgICAgICAgdGhpcy53cml0ZVRhZyh0YWcsIFBiZi5GaXhlZDMyKTtcbiAgICAgICAgdGhpcy53cml0ZUZpeGVkMzIodmFsKTtcbiAgICB9LFxuICAgIHdyaXRlU0ZpeGVkMzJGaWVsZDogZnVuY3Rpb24odGFnLCB2YWwpIHtcbiAgICAgICAgdGhpcy53cml0ZVRhZyh0YWcsIFBiZi5GaXhlZDMyKTtcbiAgICAgICAgdGhpcy53cml0ZVNGaXhlZDMyKHZhbCk7XG4gICAgfSxcbiAgICB3cml0ZUZpeGVkNjRGaWVsZDogZnVuY3Rpb24odGFnLCB2YWwpIHtcbiAgICAgICAgdGhpcy53cml0ZVRhZyh0YWcsIFBiZi5GaXhlZDY0KTtcbiAgICAgICAgdGhpcy53cml0ZUZpeGVkNjQodmFsKTtcbiAgICB9LFxuICAgIHdyaXRlU0ZpeGVkNjRGaWVsZDogZnVuY3Rpb24odGFnLCB2YWwpIHtcbiAgICAgICAgdGhpcy53cml0ZVRhZyh0YWcsIFBiZi5GaXhlZDY0KTtcbiAgICAgICAgdGhpcy53cml0ZVNGaXhlZDY0KHZhbCk7XG4gICAgfSxcbiAgICB3cml0ZVZhcmludEZpZWxkOiBmdW5jdGlvbih0YWcsIHZhbCkge1xuICAgICAgICB0aGlzLndyaXRlVGFnKHRhZywgUGJmLlZhcmludCk7XG4gICAgICAgIHRoaXMud3JpdGVWYXJpbnQodmFsKTtcbiAgICB9LFxuICAgIHdyaXRlU1ZhcmludEZpZWxkOiBmdW5jdGlvbih0YWcsIHZhbCkge1xuICAgICAgICB0aGlzLndyaXRlVGFnKHRhZywgUGJmLlZhcmludCk7XG4gICAgICAgIHRoaXMud3JpdGVTVmFyaW50KHZhbCk7XG4gICAgfSxcbiAgICB3cml0ZVN0cmluZ0ZpZWxkOiBmdW5jdGlvbih0YWcsIHN0cikge1xuICAgICAgICB0aGlzLndyaXRlVGFnKHRhZywgUGJmLkJ5dGVzKTtcbiAgICAgICAgdGhpcy53cml0ZVN0cmluZyhzdHIpO1xuICAgIH0sXG4gICAgd3JpdGVGbG9hdEZpZWxkOiBmdW5jdGlvbih0YWcsIHZhbCkge1xuICAgICAgICB0aGlzLndyaXRlVGFnKHRhZywgUGJmLkZpeGVkMzIpO1xuICAgICAgICB0aGlzLndyaXRlRmxvYXQodmFsKTtcbiAgICB9LFxuICAgIHdyaXRlRG91YmxlRmllbGQ6IGZ1bmN0aW9uKHRhZywgdmFsKSB7XG4gICAgICAgIHRoaXMud3JpdGVUYWcodGFnLCBQYmYuRml4ZWQ2NCk7XG4gICAgICAgIHRoaXMud3JpdGVEb3VibGUodmFsKTtcbiAgICB9LFxuICAgIHdyaXRlQm9vbGVhbkZpZWxkOiBmdW5jdGlvbih0YWcsIHZhbCkge1xuICAgICAgICB0aGlzLndyaXRlVmFyaW50RmllbGQodGFnLCBCb29sZWFuKHZhbCkpO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIHJlYWRWYXJpbnRSZW1haW5kZXIodmFsLCBwYmYpIHtcbiAgICB2YXIgYnVmID0gcGJmLmJ1ZiwgYjtcblxuICAgIGIgPSBidWZbcGJmLnBvcysrXTsgdmFsICs9IChiICYgMHg3ZikgKiAweDEwMDAwMDAwOyAgICAgICAgIGlmIChiIDwgMHg4MCkgcmV0dXJuIHZhbDtcbiAgICBiID0gYnVmW3BiZi5wb3MrK107IHZhbCArPSAoYiAmIDB4N2YpICogMHg4MDAwMDAwMDA7ICAgICAgICBpZiAoYiA8IDB4ODApIHJldHVybiB2YWw7XG4gICAgYiA9IGJ1ZltwYmYucG9zKytdOyB2YWwgKz0gKGIgJiAweDdmKSAqIDB4NDAwMDAwMDAwMDA7ICAgICAgaWYgKGIgPCAweDgwKSByZXR1cm4gdmFsO1xuICAgIGIgPSBidWZbcGJmLnBvcysrXTsgdmFsICs9IChiICYgMHg3ZikgKiAweDIwMDAwMDAwMDAwMDA7ICAgIGlmIChiIDwgMHg4MCkgcmV0dXJuIHZhbDtcbiAgICBiID0gYnVmW3BiZi5wb3MrK107IHZhbCArPSAoYiAmIDB4N2YpICogMHgxMDAwMDAwMDAwMDAwMDA7ICBpZiAoYiA8IDB4ODApIHJldHVybiB2YWw7XG4gICAgYiA9IGJ1ZltwYmYucG9zKytdOyB2YWwgKz0gKGIgJiAweDdmKSAqIDB4ODAwMDAwMDAwMDAwMDAwMDsgaWYgKGIgPCAweDgwKSByZXR1cm4gdmFsO1xuXG4gICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCB2YXJpbnQgbm90IG1vcmUgdGhhbiAxMCBieXRlcycpO1xufVxuXG5mdW5jdGlvbiB3cml0ZUJpZ1ZhcmludCh2YWwsIHBiZikge1xuICAgIHBiZi5yZWFsbG9jKDEwKTtcblxuICAgIHZhciBtYXhQb3MgPSBwYmYucG9zICsgMTA7XG5cbiAgICB3aGlsZSAodmFsID49IDEpIHtcbiAgICAgICAgaWYgKHBiZi5wb3MgPj0gbWF4UG9zKSB0aHJvdyBuZXcgRXJyb3IoJ0dpdmVuIHZhcmludCBkb2VzblxcJ3QgZml0IGludG8gMTAgYnl0ZXMnKTtcbiAgICAgICAgdmFyIGIgPSB2YWwgJiAweGZmO1xuICAgICAgICBwYmYuYnVmW3BiZi5wb3MrK10gPSBiIHwgKHZhbCA+PSAweDgwID8gMHg4MCA6IDApO1xuICAgICAgICB2YWwgLz0gMHg4MDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlYWxsb2NGb3JSYXdNZXNzYWdlKHN0YXJ0UG9zLCBsZW4sIHBiZikge1xuICAgIHZhciBleHRyYUxlbiA9XG4gICAgICAgIGxlbiA8PSAweDNmZmYgPyAxIDpcbiAgICAgICAgbGVuIDw9IDB4MWZmZmZmID8gMiA6XG4gICAgICAgIGxlbiA8PSAweGZmZmZmZmYgPyAzIDogTWF0aC5jZWlsKE1hdGgubG9nKGxlbikgLyAoTWF0aC5MTjIgKiA3KSk7XG5cbiAgICAvLyBpZiAxIGJ5dGUgaXNuJ3QgZW5vdWdoIGZvciBlbmNvZGluZyBtZXNzYWdlIGxlbmd0aCwgc2hpZnQgdGhlIGRhdGEgdG8gdGhlIHJpZ2h0XG4gICAgcGJmLnJlYWxsb2MoZXh0cmFMZW4pO1xuICAgIGZvciAodmFyIGkgPSBwYmYucG9zIC0gMTsgaSA+PSBzdGFydFBvczsgaS0tKSBwYmYuYnVmW2kgKyBleHRyYUxlbl0gPSBwYmYuYnVmW2ldO1xufVxuXG5mdW5jdGlvbiB3cml0ZVBhY2tlZFZhcmludChhcnIsIHBiZikgICB7IGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSBwYmYud3JpdGVWYXJpbnQoYXJyW2ldKTsgICB9XG5mdW5jdGlvbiB3cml0ZVBhY2tlZFNWYXJpbnQoYXJyLCBwYmYpICB7IGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSBwYmYud3JpdGVTVmFyaW50KGFycltpXSk7ICB9XG5mdW5jdGlvbiB3cml0ZVBhY2tlZEZsb2F0KGFyciwgcGJmKSAgICB7IGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSBwYmYud3JpdGVGbG9hdChhcnJbaV0pOyAgICB9XG5mdW5jdGlvbiB3cml0ZVBhY2tlZERvdWJsZShhcnIsIHBiZikgICB7IGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSBwYmYud3JpdGVEb3VibGUoYXJyW2ldKTsgICB9XG5mdW5jdGlvbiB3cml0ZVBhY2tlZEJvb2xlYW4oYXJyLCBwYmYpICB7IGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSBwYmYud3JpdGVCb29sZWFuKGFycltpXSk7ICB9XG5mdW5jdGlvbiB3cml0ZVBhY2tlZEZpeGVkMzIoYXJyLCBwYmYpICB7IGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSBwYmYud3JpdGVGaXhlZDMyKGFycltpXSk7ICB9XG5mdW5jdGlvbiB3cml0ZVBhY2tlZFNGaXhlZDMyKGFyciwgcGJmKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSBwYmYud3JpdGVTRml4ZWQzMihhcnJbaV0pOyB9XG5mdW5jdGlvbiB3cml0ZVBhY2tlZEZpeGVkNjQoYXJyLCBwYmYpICB7IGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSBwYmYud3JpdGVGaXhlZDY0KGFycltpXSk7ICB9XG5mdW5jdGlvbiB3cml0ZVBhY2tlZFNGaXhlZDY0KGFyciwgcGJmKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSBwYmYud3JpdGVTRml4ZWQ2NChhcnJbaV0pOyB9XG4iLCJleHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiJdfQ==
