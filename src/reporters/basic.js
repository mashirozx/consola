import util from 'util'
import { isPlainObject, parseStack, align } from '../utils'

export default class BasicReporter {
  constructor (options) {
    this.options = Object.assign({
      stream: process.stdout,
      errStream: process.stderr,
      alignment: 'left',
      showType: false
    }, options)

    this.write = this.write.bind(this)
    this.writeError = this.writeError.bind(this)
  }

  write (data) {
    this.options.stream.write(data)
  }

  writeError (data) {
    this.options.errStream.write(data)
  }

  formatStack (stack) {
    return '> ' + parseStack(stack).join('\n> ')
  }

  format (arg) {
    if (isPlainObject(arg)) {
      return JSON.stringify(arg, null, 2)
    }

    if (util.formatWithOptions) {
      // Node >= 10
      return util.formatWithOptions({ colors: true }, arg)
    } else {
      return util.format(arg)
    }
  }

  getFields (logObj) {
    let message = logObj.message || ''
    let type = logObj.type || ''
    let tag = logObj.tag || ''
    let date = logObj.date.toLocaleTimeString()

    // Format args
    const args = logObj.args.map(arg => {
      // error-like argument
      if (arg.stack) {
        if (!message.length && arg.message) {
          message = arg.message
        }
        if (!type.length) {
          type = 'error'
        }
        return this.formatStack(arg.stack, { suffix: ' ↲' })
      }

      // General argument
      return this.format(arg)
    })

    // If no message is provided, assume args[0] as message
    if (!message.length && args.length) {
      message = args.shift()
    }

    return {
      args,
      date,
      message,
      tag,
      type
    }
  }

  log (logObj) {
    const fields = this.getFields(logObj)
    const write = logObj.isError ? this.writeError : this.write

    // Print date
    write((`[${align(this.options.alignment, fields.date, 8)}] `))

    // Print type
    if (fields.type.length) {
      write((`[${align(this.options.alignment, fields.type.toUpperCase(), 7)}] `))
    }

    // Print tag
    if (fields.tag.length) {
      write(`[${fields.tag}] `)
    }

    // Print message
    if (fields.message.length) {
      write(fields.message)
    }

    // Print additional args
    if (fields.args.length) {
      write('\n' + (fields.args.join(' ')))
    }

    // Newline
    write('\n')
  }
}
