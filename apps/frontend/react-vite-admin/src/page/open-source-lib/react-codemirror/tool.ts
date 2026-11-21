export const mockData = `#include <cstdio>
#include <cstdint>
#include <cstdlib>
#include <csignal>
#include <thread>
#include <chrono>
#include <sys/time.h>
#include <ara/com/e2exf/status_handler.h>
#include <ara/exec/execution_client.h>
#include <ara/log/logmanager.h>
#include <ara/log/logging.h>

#include "ara/core/initialization.h"

#include "CtApArbitration_Interface.h"
#define ENABLE_MESSAGE_STATISTICS 1
extern char *__progname;
using namespace ara::log;  // 'using' is OK for ara::log

struct MessageInfo {
    // 帧信息
    uint32_t last_frame;
    uint32_t diff;
    // 计数信息
    uint32_t drop_cnt;
    uint32_t same_cnt;
    uint32_t back_cnt;
    uint32_t normal_cnt;
    // 时间戳分类统计
    uint32_t ts_less_10ms;
    uint32_t ts_less_12ms;
    uint32_t ts_less_14ms;
    uint32_t ts_less_16ms;
    uint32_t ts_less_18ms;
    uint32_t ts_less_20ms;
    uint32_t ts_more_20ms;
    uint32_t ts_more_30ms;
    uint32_t ts_more_40ms;
    uint32_t ts_more_50ms;
    uint32_t ts_more_100ms;
    uint32_t ts_more_300ms;
    uint32_t ts_more_500ms;
    uint32_t ts_more_1000ms;
    uint32_t ts_more_2000ms;
    // 发送时间统计
    uint32_t send_less_1ms;
    uint32_t send_more_1ms;
    uint32_t send_more_5ms;
    uint32_t send_more_10ms;
    uint32_t send_more_20ms;
    uint32_t send_more_50ms;
    uint32_t send_more_100ms;
    // 回调时间统计
    uint32_t callback_less_10ms;
    uint32_t callback_more_10ms;
    // 打印计数
    uint16_t printf_counter;

    MessageInfo() :
        last_frame(0), diff(0), drop_cnt(0), same_cnt(0), back_cnt(0),
        normal_cnt(0), ts_less_10ms(0), ts_less_12ms(0),
        ts_less_14ms(0), ts_less_16ms(0), ts_less_18ms(0),
        ts_less_20ms(0), ts_more_20ms(0), ts_more_30ms(0),
        ts_more_40ms(0), ts_more_50ms(0), ts_more_100ms(0),
        ts_more_300ms(0), ts_more_500ms(0), ts_more_1000ms(0),
        ts_more_2000ms(0), send_less_1ms(0), send_more_1ms(0), send_more_5ms(0),
        send_more_10ms(0), send_more_20ms(0), send_more_50ms(0), send_more_100ms(0),
        callback_less_10ms(0), callback_more_10ms(0), printf_counter(0) {}
};
namespace
{

// Atomic flag for exit after SIGTERM caught
std::atomic_bool continueExecution{true};

void SigTermHandler(int signal)
{
    if (signal == SIGTERM || SIGINT == signal) {
        // set atomic exit flag
        continueExecution = false;
    }
}

bool RegisterSigTermHandler()
{
    struct sigaction sa;
    sa.sa_handler = SigTermHandler;
    sa.sa_flags = 0;
    sigemptyset(&sa.sa_mask);
    // register signal handler
    if (sigaction(SIGTERM, &sa, NULL) == -1) {
        // Could not register a SIGTERM signal handler
        return false;
    }
    if (sigaction(SIGINT, &sa, NULL) == -1) {
        // Could not register a SIGINT signal handler
        return false;
    }
    return true;
}

}  // namespace

uint64_t GetTickus(void)
{
    // struct timespec tspec;
    // clock_gettime(CLOCK_MONOTONIC, &tspec);
    // return tspec.tv_sec*1000000+tspec.tv_nsec/1000;
    timeval tv;
    gettimeofday(&tv, NULL);
    return (tv.tv_sec*1000000+tv.tv_usec);
}

void MessageStatistics(MessageInfo &msg_info, uint32_t cycleCounter, uint64_t ts, std::string event_name) {
    uint64_t start_time = GetTickus();
    if(msg_info.last_frame > 0) {
        msg_info.diff = cycleCounter - msg_info.last_frame;
        if(msg_info.diff > 1) {
            uint32_t drop_cnt_temp = msg_info.diff - 1;
            msg_info.drop_cnt += drop_cnt_temp;
        } else if(msg_info.diff < 0) {
            uint32_t back_cnt_temp = 1 - msg_info.diff;
            msg_info.back_cnt += back_cnt_temp;
        } else if(msg_info.diff == 0) {
            msg_info.same_cnt++;
        } else {
            msg_info.normal_cnt++;
        }
    }
    msg_info.last_frame = cycleCounter;
    uint64_t timestamp = GetTickus() - ts;
    if(timestamp < 10000) {
        msg_info.ts_less_10ms++;
    } else if(timestamp < 12000) {
        msg_info.ts_less_12ms++;
    } else if(timestamp < 14000) {
        msg_info.ts_less_14ms++;
    } else if(timestamp < 16000) {
        msg_info.ts_less_16ms++;
    } else if(timestamp < 18000) {
        msg_info.ts_less_18ms++;
    } else if(timestamp < 20000) {
        msg_info.ts_less_20ms++;
    } else if(timestamp < 30000) {
        msg_info.ts_more_20ms++;
    } else if(timestamp < 40000) {
        msg_info.ts_more_30ms++;
    } else if(timestamp < 50000) {
        msg_info.ts_more_40ms++;
    } else if(timestamp < 100000) {
        msg_info.ts_more_50ms++;
    } else if(timestamp < 300000) {
        msg_info.ts_more_100ms++;
    } else if(timestamp < 500000) {
        msg_info.ts_more_300ms++;
    } else if(timestamp < 1000000) {
        msg_info.ts_more_500ms++;
    } else if(timestamp < 2000000) {
        msg_info.ts_more_1000ms++;
    } else {
        msg_info.ts_more_2000ms++;
    }
    uint64_t end_time = GetTickus();
    if(end_time - start_time < 10000) {
        msg_info.callback_less_10ms++;
    } else {
        msg_info.callback_more_10ms++;
    }
    if(msg_info.printf_counter++ == 1000) {
        msg_info.printf_counter = 0;
        Logger& logger = CreateLogger(__progname, event_name.c_str(), LogLevel::kVerbose);
        logger.LogInfo() << __progname << " " << event_name
            << ",drop_cnt=" << msg_info.drop_cnt
            << ",same_cnt=" << msg_info.same_cnt
            << ",back_cnt=" << msg_info.back_cnt
            << ",normal_cnt=" << msg_info.normal_cnt
            << ",msg_info.ts_less_10ms=" << msg_info.ts_less_10ms
            << ",msg_info.ts_less_12ms=" << msg_info.ts_less_12ms
            << ",msg_info.ts_less_14ms=" << msg_info.ts_less_14ms
            << ",msg_info.ts_less_16ms=" << msg_info.ts_less_16ms
            << ",msg_info.ts_less_18ms=" << msg_info.ts_less_18ms
            << ",msg_info.ts_less_20ms=" << msg_info.ts_less_20ms
            << ",ts_more_20ms=" << msg_info.ts_more_20ms
            << ",ts_more_30ms=" << msg_info.ts_more_30ms
            << ",ts_more_40ms=" << msg_info.ts_more_40ms
            << ",ts_more_50ms=" << msg_info.ts_more_50ms
            << ",ts_more_100ms=" << msg_info.ts_more_100ms
            << ",ts_more_300ms=" << msg_info.ts_more_300ms
            << ",ts_more_500ms=" << msg_info.ts_more_500ms
            << ",ts_more_1000ms=" << msg_info.ts_more_1000ms
            << ",ts_more_2000ms=" << msg_info.ts_more_2000ms
            << ",callback_less_10ms=" << msg_info.callback_less_10ms
            << ",callback_more_10ms=" << msg_info.callback_more_10ms;
    }
}

void Event_Handshake_ReqHandle(void *msg)
{
        ::Struct_FSMOut *eventMsg = (::Struct_FSMOut*)msg;
    #if ENABLE_MESSAGE_STATISTICS
        static MessageInfo msgInfo;
    //TODO:Demo code, needs to be adapted to your structure
    MessageStatistics(msgInfo, eventMsg->Frame, eventMsg->timeStamp, "Event_Handshake_ReqHandle");
#else
        std::cout << "received Event_Handshake_ReqHandle event callback " <<std::endl;
#endif
}
void Event_ControlHandle(void *msg)
{
        ::Struct_ControlOut *eventMsg = (::Struct_ControlOut*)msg;
    #if ENABLE_MESSAGE_STATISTICS
        static MessageInfo msgInfo;
    //TODO:Demo code, needs to be adapted to your structure
    MessageStatistics(msgInfo, eventMsg->Frame, eventMsg->timeStamp, "Event_ControlHandle");
#else
        std::cout << "received Event_ControlHandle event callback " <<std::endl;
#endif
}
void Event_SafeControlOutHandle(void *msg)
{
        ::Struct_SafeControlOut *eventMsg = (::Struct_SafeControlOut*)msg;
    #if ENABLE_MESSAGE_STATISTICS
        static MessageInfo msgInfo;
    //TODO:Demo code, needs to be adapted to your structure
    MessageStatistics(msgInfo, eventMsg->Frame, eventMsg->timeStamp, "Event_SafeControlOutHandle");
#else
        std::cout << "received Event_SafeControlOutHandle event callback " <<std::endl;
#endif
}

void ThreadAct1()
{
    Logger& logger = CreateLogger("T1", "A sample context", LogLevel::kVerbose);
    logger.LogInfo() << "Update: ThreadAct1";
    CTAPARBITRATION_Interface::getInstance()->regEvent_Handshake_ReqHandle(Event_Handshake_ReqHandle);
    CTAPARBITRATION_Interface::getInstance()->regEvent_ControlHandle(Event_ControlHandle);
    CTAPARBITRATION_Interface::getInstance()->regEvent_SafeControlOutHandle(Event_SafeControlOutHandle);


    CTAPARBITRATION_Interface::getInstance()->init();
        std::this_thread::sleep_for(std::chrono::milliseconds(1000));
    while (continueExecution) {
        std::this_thread::sleep_for(std::chrono::milliseconds(1000));
    }
    logger.LogInfo() << "Update: ThreadAct1 init end";
}
int main(int argc, char* argv[])
{
    if (!ara::core::Initialize()) {
        // No interaction with ARA is possible here since initialization failed
        return EXIT_FAILURE;
    }

    ara::exec::ExecutionClient exec_client;
    exec_client.ReportExecutionState(ara::exec::ExecutionState::kRunning);

    Logger& logger = CreateLogger("T0", "A sample context", LogLevel::kVerbose);

    if (!RegisterSigTermHandler()) {
        logger.LogError() << "Unable to register signal handler";
    }

    std::thread act1(ThreadAct1);
    act1.join();
    if (!ara::core::Deinitialize()) {
        // No interaction with ARA is possible here since some ARA resources can be destroyed already
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}`;
