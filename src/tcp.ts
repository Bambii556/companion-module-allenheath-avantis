import { InstanceStatus, TCPHelper as tcp, TCPHelper } from '@companion-module/base'
import { Config } from './config'
import AvantisInstance from './index'

export class TCP {
  private readonly instance: AvantisInstance
  private tcpSocket!: TCPHelper
  private tcpHost: string
  private tcpPort: number
  public isConnected: boolean = false

  constructor(instance: AvantisInstance, config: Config) {
    this.instance = instance
    this.tcpHost = config.host
    this.tcpPort = 51325
  }

  /**
   * @description Close connection on instance disable/removal
   */
  public destroy(): void {

    if (this.tcpSocket) {
      this.tcpSocket.destroy()
    }
  }

  /**
   * @description Create a TCP connection to vMix and start API polling
   */
  public init(connectCallback: () => void): void {
    if (!this.tcpHost) {
      this.instance.log(
        'warn',
        `Unable to connect to avantis, please confugre a host in the connection configuration`
      )
      throw new Error(`Unable to connect to avantis, please confugre a host in the connection configuration`);
    }

    this.destroy();

    this.instance.updateStatus(InstanceStatus.Connecting)
    this.tcpSocket = new tcp(this.tcpHost, this.tcpPort)

    this.tcpSocket.on('status_change', (status, message) => {
      if (message) this.instance.log('debug', `TCP Status: (${status}) ${message}`)

      if (status === 'ok') {
        this.isConnected = true
        this.instance.updateStatus(InstanceStatus.Ok)
      } else if (status === 'connecting') {
        this.isConnected = false
        this.instance.updateStatus(InstanceStatus.Connecting)
      } else if (status === 'disconnected') {
        this.isConnected = false
        this.instance.updateStatus(InstanceStatus.Disconnected)
      } else if (status === 'unknown_error') {
        this.isConnected = false
        this.instance.updateStatus(InstanceStatus.UnknownError)
      }
    })

    this.tcpSocket.on('error', (err: Error) => {
      this.instance.log('error', `TCP Error: ${err.message}`)
      this.instance.updateStatus(InstanceStatus.UnknownError)
    })

    this.tcpSocket.on('connect', () => {
      this.instance.log('debug', 'TCP Connect: Connected Function Socket')
      connectCallback();
    })

    this.tcpSocket.on('data', (msg: Buffer) => {
      if (!msg) {
        return;
      }

      const data = JSON.parse(JSON.stringify(msg))['data'] as number[];
      const result = {
        data: data,
        hex: data.map(x => x.toString(16))
      };
      this.instance.log('debug', `TCP Data: ${JSON.stringify(result)}`)

      this.instance.validateTCPFeedback(result);
    })
  }

  async sendCommands(commands: Buffer[]): Promise<boolean> {
    let result = true;
    try {
      for (const command of commands) {
        const respone = await this.sendCommand(command as Buffer);
        if (!respone) {
          result = respone;
        }
      }
    } catch (error) {
      this.instance.log('error', `Failed sending command: ${(error as Error).message}`)
      throw error;
    }
    return result;
  }

  /**
   * @param command function and any params
   * @description Check TCP connection status and format command to send to vMix
   */
  async sendCommand(command: Buffer): Promise<boolean> {
    try {
      if (this.tcpSocket && this.tcpSocket.isConnected) {
        this.instance.log('debug', `sending '${command.toString('hex')}' ${command.length}`)

        const response = await this.tcpSocket.send(command);
        return response;
      }
    } catch (error) {
      this.instance.log('error', `Failed sending command: ${(error as Error).message}`)
      throw error;
    }
    return false;
  }
}
