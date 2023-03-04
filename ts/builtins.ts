export const outerDefs = [
    `
    interface IERC20 {
        function totalSupply() external view returns (uint256);
        function name() external view returns (string memory);
        function symbol() external view returns (string memory);
        function decimals() external view returns (uint256);
        function balanceOf(address owner) external view returns (uint256);
        function allowance(address owner, address spender) external view returns (uint256);
        function approve(address spender, uint256 amount) external returns (bool);
        function transfer(address to, uint256 amount) external returns (bool);
        function transferFrom(address owner, address to, uint256 amount) external returns (bool);
    }
    `,
    `
    interface IERC721 {
        function name() external view returns (string memory);
        function symbol() external view returns (string memory);
        function balanceOf(address owner) external view returns (uint256);
        function ownerOf(uint256 tokenId) external view returns (address);
        function isApprovedForAll(address owner, address operator) external view returns (bool);
        function getApproved(uint256 tokenId) external view returns (address);
        function approve(address operator, uint256 tokenId) external;
        function setApprovalForAll(address operator, bool isApproved) external;
        function transferFrom(address owner, address to, uint256 tokenId) external;
        function safeTransferFrom(address owner, address to, uint256 tokenId) external;
        function safeTransferFrom(address owner, address to, uint256 tokenId, bytes calldata data) external;
    }
    `,
    `interface IWETH is IERC20 {
        function deposit() external payable;
        function withdraw(uint256 amount) external;
    }`,
];