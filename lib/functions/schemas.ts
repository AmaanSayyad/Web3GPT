import { ChatRequestOptions } from 'ai'

export const functionSchemas: ChatRequestOptions['functions'] = [
  {
    name: 'deploy_contract',
    description: 'Deploy a smart contract',
    parameters: {
      type: 'object',
      description: `This function deploys a smart contract to an EVM compatible chain.  It returns the tx hash of the deployment and an IPFS url to a directory of files used for the contract.  Only call this function in a separate chat message do not call it from a message with other text.  Share the explorer url and ipfs url with the user.`,
      properties: {
        contractName: {
          type: 'string'
        },
        chainName: {
          type: 'string',
          description:
            `Name of the EVM compatible chain we are deploying to.  Default to 'Base Goerli Testnet' if not specified.`
        },
        sourceCode: {
          type: 'string',
          description:
            "Source code of the smart contract. Use Solidity v0.8.20+ and ensure that it is the full source code and will compile. The source code should be formatted as a single-line string, with all line breaks and quotes escaped to be valid in a JSON context. Specifically, newline characters should be represented as '\\n', and double quotes should be escaped as '\\\"'."
        },
        constructorArgs: {
          type: 'array',
          items: {
            oneOf: [
              {
                type: 'string'
              },
              {
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            ]
          },
          description:
            "Arguments for the contract's constructor. Each argument can be a string or an array of strings. But the final constructor arguments must be an array.  Can be empty array if the constructor has no arguments."
        }
      },
      required: ['contractName', 'chainName', 'sourceCode', 'constructorArgs']
    }
  },
  {
    name: 'text_to_image',
    description: `This function generates an image from text.  Only call this function in a separate chat message do not call it from a message with other text.  Show the image to the user using the default IPFS gateway ipfs.io/ipfs/{CID} in markdown.  Use the metadata as the baseTokenURI if creating an NFT.`,
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to generate an image from.'
        }
      },
      required: ['text']
    }
  }
]
