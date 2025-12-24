// Group Container types for canvas grouping feature

export interface GroupChild {
    id: string;
    type: string;
    relativeTransform: {
        x: number;
        y: number;
        scaleX?: number;
        scaleY?: number;
        rotation?: number;
    };
}

export interface GroupContainerState {
    id: string;
    type: 'group';
    x: number;
    y: number;
    width: number;
    height: number;
    padding: number;
    children: GroupChild[];
    meta: {
        name: string;
        createdAt?: number;
        [key: string]: any;
    };
}
